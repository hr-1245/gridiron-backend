import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { PlayerEntity, PlayerImageEntity } from '../entity/players.entity';
import { userEntity } from 'src/modules/user/entity/user.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
@Injectable()
export class PlayerOcrService {
  private readonly openAI: OpenAI;

  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>,
    @InjectRepository(PlayerImageEntity)
    private readonly playerImageRepo: Repository<PlayerImageEntity>,
    @InjectRepository(PlayerPositionEntity)
    private readonly playerPositionRepo: Repository<PlayerPositionEntity>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {
    // Initialize OpenAI Client with API Key
    this.openAI = new OpenAI({
      apiKey: this.configService.get<string>('GPT_API_KEY'),
    });
  }

  async processPlayerImage(file: Express.Multer.File, userId: number): Promise<PlayerEntity> {
    let uploadResult: any;
    const queryRunner = this.playerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!file) throw new BadRequestException('No file uploaded');

      // Upload to Cloudinary
      uploadResult = await this.cloudinaryService.uploadFile(file);
      if (uploadResult.error || !uploadResult.secure_url) {
        throw new InternalServerErrorException('Cloudinary upload failed');
      }

      // Extract structured data using GPT-4o Mini
      const structuredData = await this.extractStructuredPlayerData(file);
      console.log('Structured Data from GPT-4o Mini:', structuredData);

      // Find player position
      const position = await this.playerPositionRepo.findOne({
        where: { code: structuredData.position },
      });
      if (!position) throw new NotFoundException(`Position ${structuredData.position} not found`);

      // Create new player
      const newPlayer = this.playerRepo.create({
        name: structuredData.name,
        overallRating: structuredData.overallRating,
        user: { id: userId },
        position: { id: position.id },
      });
      const player = await queryRunner.manager.save(PlayerEntity, newPlayer);

      // Save player image
      const playerImage = this.playerImageRepo.create({
        url: uploadResult.secure_url,
        player: { id: player.id },
      });
      await queryRunner.manager.save(PlayerImageEntity, playerImage);

      await queryRunner.commitTransaction();

      // Return processed player details
      const foundPlayer = await this.playerRepo.findOne({
        where: { id: player.id },
        relations: ['images'],
      });
      if (!foundPlayer) throw new NotFoundException(`Player with ID ${player.id} not found`);
      return foundPlayer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (uploadResult?.public_id) {
        await this.cloudinaryService.deleteFile(uploadResult.public_id);
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async extractStructuredPlayerData(file: Express.Multer.File) {
    try {
      const base64Image = file.buffer.toString('base64');

      const response = await this.openAI.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that extracts structured Collage football player data from game screenshots. Only return JSON with fields: name, position, overallRating, class, height, weight, hometown.`,
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






// async uploadFile(file: Express.Multer.File, playerId: number) {
//   const uploadResponse = await this.cloudinaryService.uploadFile(file);
//   if (!uploadResponse?.secure_url) {
//     throw new NotFoundException('Failed to upload image to Cloudinary');
//   }
//   const uploadedImage = this.playerImageRepo.create({
//     player: { id: playerId },
//     url: uploadResponse.secure_url,
//   });
//   return await this.playerImageRepo.save(uploadedImage);
// }

//   async processImage(
//     file: Express.Multer.File,
//     conversionData: ConversionDto,
//   ): Promise<any> {
//     try {
//       const maxSize = 10485760;
//       if (file.size > maxSize) {
//         throw new InternalServerErrorException(
//           `File size too large. Got ${file.size}. Maximum allowed is ${maxSize} bytes.`,
//         );
//       }

//       const uploadResult = await this.cloudinaryService.uploadFile(file);
//       if (!uploadResult?.secure_url) {
//         throw new NotFoundException('Failed to upload image to Cloudinary');
//       }

//       const { positionId, positionCode, playerName, draft_round } = conversionData;
//       const position = await this.playerPositionRepo.findOne({
//         where: { id: positionId, code: positionCode },
//       });
//       if (!position) {
//         throw new NotFoundException('Invalid position or position code.');
//       }

//       let player = await this.playerRepo.findOne({
//         where: {
//           name: playerName,
//         },
//       });
//       if (!player) {
//         const newPlayer = this.playerRepo.create({
//           name: playerName,
//           position: { id: positionId },
//         });
//         player = await this.playerRepo.save(newPlayer);
//       }

//       const playerImage = await this.uploadFile(file, player.id);

//       const [ocrResult] = await this.ocrClient.textDetection({
//         image: { content: file.buffer },
//       });
//       const detections = ocrResult.textAnnotations;
//       if (!detections || detections.length === 0) {
//         throw new NotFoundException('No text detected in the image.');
//       }

//       const extractedText = detections[0].description;
//       console.log('Extracted OCR Text:', extractedText);

//       const parsedAttributes = {
//         playerName: extractedText?.match(/([A-Z][a-z]+)\s([A-Z][a-z]+)/)?.[0] || 'Unknown',
//         position: extractedText?.match(/\b(QB|WR|TE|RB|LB|CB|S|OL|DL)\b/)?.[0] || 'Unknown',
//         agility: extractedText?.match(/Agility\s+(\d+)/)?.[1] || 'N/A',
//         jumping: extractedText?.match(/Jumping\s+(\d+)/)?.[1] || 'N/A',
//       };

//       return {
//         message: 'Image processed successfully',
//         imageUrl: uploadResult.secure_url,
//         extractedText,
//         parsedAttributes,
//         player,
//       };
//     } catch (error) {
//       console.error('OCR Processing Error:', error);
//       throw new InternalServerErrorException(error.message);
//     }
//   }
// }


// async uploadFile(file: Express.Multer.File, playerId: number) {
//   const uploadResponse = await this.cloudinaryService.uploadFile(file);
//   if (!uploadResponse?.secure_url) {
//     throw new NotFoundException('Failed to upload image to Cloudinary');
//   }
//   const uploadedImage = this.playerImageRepo.create({
//     player: { id: playerId },
//     url: uploadResponse.secure_url,
//   });
//   return await this.playerImageRepo.save(uploadedImage);
// }

//   async processImage(
//     file: Express.Multer.File,
//     conversionData: ConversionDto,
//   ): Promise<any> {
//     try {
//       const maxSize = 10485760;
//       if (file.size > maxSize) {
//         throw new InternalServerErrorException(
//           `File size too large. Got ${file.size}. Maximum allowed is ${maxSize} bytes.`,
//         );
//       }

//       const uploadResult = await this.cloudinaryService.uploadFile(file);
//       if (!uploadResult?.secure_url) {
//         throw new NotFoundException('Failed to upload image to Cloudinary');
//       }

//       const { positionId, positionCode, playerName, draft_round } = conversionData;
//       const position = await this.playerPositionRepo.findOne({
//         where: { id: positionId, code: positionCode },
//       });
//       if (!position) {
//         throw new NotFoundException('Invalid position or position code.');
//       }

//       let player = await this.playerRepo.findOne({
//         where: {
//           name: playerName,
//         },
//       });
//       if (!player) {
//         const newPlayer = this.playerRepo.create({
//           name: playerName,
//           position: { id: positionId },
//         });
//         player = await this.playerRepo.save(newPlayer);
//       }

//       const playerImage = await this.uploadFile(file, player.id);

//       const [ocrResult] = await this.ocrClient.textDetection({
//         image: { content: file.buffer },
//       });
//       const detections = ocrResult.textAnnotations;
//       if (!detections || detections.length === 0) {
//         throw new NotFoundException('No text detected in the image.');
//       }

//       const extractedText = detections[0].description;
//       console.log('Extracted OCR Text:', extractedText);

//       const parsedAttributes = {
//         playerName: extractedText?.match(/([A-Z][a-z]+)\s([A-Z][a-z]+)/)?.[0] || 'Unknown',
//         position: extractedText?.match(/\b(QB|WR|TE|RB|LB|CB|S|OL|DL)\b/)?.[0] || 'Unknown',
//         agility: extractedText?.match(/Agility\s+(\d+)/)?.[1] || 'N/A',
//         jumping: extractedText?.match(/Jumping\s+(\d+)/)?.[1] || 'N/A',
//       };

//       return {
//         message: 'Image processed successfully',
//         imageUrl: uploadResult.secure_url,
//         extractedText,
//         parsedAttributes,
//         player,
//       };
//     } catch (error) {
//       console.error('OCR Processing Error:', error);
//       throw new InternalServerErrorException(error.message);
//     }
//   }
// }
