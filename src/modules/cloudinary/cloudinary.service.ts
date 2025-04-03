import { Injectable, Logger } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
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
}