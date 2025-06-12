import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import * as streamifier from 'streamifier';
import { Repository } from 'typeorm';
import { userEntity } from '../user/entity/userEntity';

@Injectable()
export class CloudinaryService {
  constructor(
    @InjectRepository(userEntity)
    private readonly UserEntity: Repository<userEntity>
  ) { }
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.logger.error('Cloudinary upload timed out');
        reject(new Error('Cloudinary upload timed out'));
      }, 50000); // 15 seconds timeout

      const uploadStream = v2.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          clearTimeout(timeout);
          if (error) {
            this.logger.error('Cloudinary upload error', error);
            reject(error);
          } else if (result) {
            this.logger.log(`File uploaded successfully: ${result.public_id}`);
            resolve(result);
          } else {
            const err = new Error('Undefined upload result');
            this.logger.error(err);
            reject(err);
          }
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
  async uploadAndSaveProfilePicture(userId: number, file: Express.Multer.File): Promise<userEntity> {
    const uploadResult = await this.uploadFile(file);

    const user = await this.UserEntity.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    user.profile_picture_url = uploadResult.secure_url;
    await this.UserEntity.save(user);

    this.logger.log(`Updated profile picture for user ${user.email}`);
    return user;
  }


  async deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!publicId) {
        const err = new Error('Invalid public ID');
        this.logger.error(err);
        return reject(err);
      }

      v2.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error(`Failed to delete file ${publicId}`, error);
          reject(error);
        } else if (result.result === 'ok') {
          this.logger.log(`File deleted: ${publicId}`);
          resolve();
        } else {
          const err = new Error(`Failed to delete file ${publicId}`);
          this.logger.error(err);
          reject(err);
        }
      });
    });
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    try {
      await Promise.all(
        publicIds.map(publicId =>
          this.deleteFile(publicId).catch(error => {
            this.logger.error(`Failed to delete ${publicId}: ${error.message}`);
          })
        )
      );
    } catch (error) {
      this.logger.error('Error deleting multiple files', error);
      throw error;
    }
  }
  async deleteAllFiles(): Promise<void> {
    try {
      const allPublicIds: string[] = [];

      const fetchAllResources = async (nextCursor?: string): Promise<void> => {
        const response = await v2.api.resources({
          type: 'upload',
          max_results: 500,
          next_cursor: nextCursor,
        });

        const publicIds = response.resources.map((res: any) => res.public_id);
        allPublicIds.push(...publicIds);

        if (response.next_cursor) {
          await fetchAllResources(response.next_cursor);
        }
      };

      await fetchAllResources();

      this.logger.log(`Found ${allPublicIds.length} files to delete`);

      await this.deleteMultipleFiles(allPublicIds);
      this.logger.log('All files deleted successfully');
    } catch (error) {
      this.logger.error('Failed to delete all files', error);
      throw new Error('Failed to delete all files');
    }
  }

}