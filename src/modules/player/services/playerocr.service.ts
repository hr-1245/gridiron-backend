import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { PlayerEntity, PlayerImageEntity } from '../entity/players.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import { OpenAI } from 'openai';

@Injectable()
export class PlayerOcrService {
  private readonly openAI: OpenAI;
  private readonly logger = new Logger(PlayerOcrService.name);

  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,

    @InjectRepository(PlayerImageEntity)
    private readonly playerImageRepo: Repository<PlayerImageEntity>,

    @InjectRepository(PlayerPositionEntity)
    private readonly playerPositionRepo: Repository<PlayerPositionEntity>,

    @InjectQueue('imageProcessing')
    private readonly imageQueue: Queue,

    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {
    this.openAI = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_KEY'),
    });
  }

  async processPlayerImage(files: Express.Multer.File[], userId: number): Promise<any> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const primaryFile = files[0];
    const attributeFiles = files.slice(1);

    let uploadResult: any;
    const queryRunner = this.playerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      uploadResult = await this.cloudinaryService.uploadFile(primaryFile);
      if (!uploadResult?.secure_url) {
        throw new InternalServerErrorException('Primary image upload failed');
      }

      const structuredData = {
        name: 'M. Nielsen',
        overallRating: 90,
        position: 'QB',
      };

      const position = await this.playerPositionRepo.findOne({ where: { code: structuredData.position } });
      if (!position) {
        throw new NotFoundException(`Position ${structuredData.position} not found`);
      }

      const newPlayer = this.playerRepo.create({
        name: structuredData.name,
        overallRating: structuredData.overallRating,
        user: { id: userId },
        position: { id: position.id },
      });

      const player = await queryRunner.manager.save(PlayerEntity, newPlayer);

      const playerImage = this.playerImageRepo.create({
        url: uploadResult.secure_url,
        player: { id: player.id },
      });
      await queryRunner.manager.save(PlayerImageEntity, playerImage);

      const uploadPromises = attributeFiles.map(async (file, index) => {
        try {
          const result = await this.cloudinaryService.uploadFile(file);
          if (!result?.secure_url) throw new Error(`Upload failed at index ${index}`);

          await this.imageQueue.add('processImage', {
            userId,
            playerId: player.id,
            imageUrl: result.secure_url,
            originalName: file.originalname,
          });

          this.logger.log(`Queued image: ${file.originalname}`);
          return { file: file.originalname, status: 'queued' };
        } catch (err) {
          this.logger.error(`Error processing file at index ${index}: ${err.message}`);
          return { file: file.originalname, status: 'error', error: err.message };
        }
      });

      const queueResults = await Promise.allSettled(uploadPromises);

      await queryRunner.commitTransaction();

      return {
        message: 'Player and images uploaded successfully. Attribute images queued for processing.',
        playerId: player.id,
        imagesQueued: queueResults.map((r) => (r.status === 'fulfilled' ? r.value : r.reason)),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (uploadResult?.public_id) {
        await this.cloudinaryService.deleteFile(uploadResult.public_id);
      }

      this.logger.error(`Player image processing failed: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Uncomment and implement this later when ready:
  // async extractStructuredPlayerData(file: Express.Multer.File): Promise<any> {
  //   // TODO: Implement GPT-4o based extraction logic.
  // }

  async extractStructuredPlayerData(file: Express.Multer.File) {
    try {
      const base64Image = file.buffer.toString('base64');

      const response = await this.openAI.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that extracts structured Collage football player data from game screenshots. Only return JSON with fields: NAME, POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, TENDENCY.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: `Extract the player's data shown on the right side of the screen.`,
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0].message.content;

      try {
        const parsed = JSON.parse(content as any);
        return parsed;
      } catch (err) {
        console.error('Failed to parse GPT response:', content);
        throw new Error('Failed to extract structured player data using GPT-4o Mini.');
      }
    } catch (error) {
      console.error('OpenAI GPT-4o error:', error);
      throw new InternalServerErrorException('Failed to extract structured data using GPT-4o Mini.');
    }
  }
}
