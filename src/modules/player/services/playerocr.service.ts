import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ocr from '@google-cloud/vision';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import {
  PlayerEntity,
  PlayerImageEntity,
} from '../entity/players.entity';
import { userEntity } from 'src/modules/user/entity/user.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import { POSTION_CODE } from 'src/types/enums/roles';

@Injectable()
export class PlayerOcrService {
  private ocrClient: ocr.ImageAnnotatorClient;

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
    const credentialsPath = this.configService.get<string>('OCR_KEY_FILE');
    if (!credentialsPath) {
      throw new InternalServerErrorException('OCR_KEY_FILE not configured');
    }
    this.ocrClient = new ocr.ImageAnnotatorClient({
      keyFilename: credentialsPath,
    });
  }

  async processPlayerImage(file: Express.Multer.File, userId: number): Promise<PlayerEntity> {
    let uploadResult: any;
    const queryRunner = this.playerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!file) throw new BadRequestException('No file uploaded');

      uploadResult = await this.cloudinaryService.uploadFile(file);
      if (uploadResult.error || !uploadResult.secure_url) {
        throw new InternalServerErrorException('Cloudinary upload failed');
      }

      const { playerName, positionCode, ovr } = await this.extractAndParseData(uploadResult.secure_url);

      const position = await this.playerPositionRepo.findOne({ where: { code: positionCode } });
      if (!position) throw new NotFoundException(`Position ${positionCode} not found`);

      let player = await this.playerRepo.findOne({
        where: { name: playerName },
        relations: ['images'],
      });

      if (!player) {
        const newPlayer = this.playerRepo.create({
          name: playerName,
          overallRating: ovr,
          user: { id: userId },
          position: { id: position.id },
        });
        player = await queryRunner.manager.save(PlayerEntity, newPlayer);
      }

      const playerImage = this.playerImageRepo.create({
        url: uploadResult.secure_url,
        player: { id: player.id },
      });
      await queryRunner.manager.save(PlayerImageEntity, playerImage);
      await queryRunner.commitTransaction();

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

  private async extractAndParseData(imageUrl: string): Promise<{
    playerName: string;
    positionCode: POSTION_CODE;
    ovr: number;
  }> {
    try {
      const [result] = await this.ocrClient.textDetection(imageUrl);
      const ocrText = result.textAnnotations?.[0]?.description || '';
      console.log('Extracted OCR Text:', ocrText);

      const allLines = ocrText.split('\n').map((line) => line.trim()).filter((line) => line);

      const expectedLabels = ['NAME', 'POS', 'YEAR', 'OVR', 'REASON'];
      const labelMap: Record<string, string> = {};
      let labelSectionEnd = allLines.findIndex((line) => !expectedLabels.includes(line.toUpperCase()));

      if (labelSectionEnd === -1) labelSectionEnd = allLines.length;

      const labelLines = allLines.slice(0, labelSectionEnd);
      const valueLines = allLines.slice(labelSectionEnd);

      labelLines.forEach((label, index) => {
        const upperLabel = label.toUpperCase();
        if (expectedLabels.includes(upperLabel) && valueLines[index]) {
          labelMap[upperLabel] = valueLines[index];
        }
      });

      console.log('Parsed Label Map:', labelMap);

      let playerName = labelMap['NAME'];
      let positionCode = labelMap['POS'];
      let ovrText = labelMap['OVR'];

      // 🛑 Fallback if label map is empty or not matching
      if (!playerName || !positionCode || !ovrText) {
        console.log('Fallback to regex-based extraction');
        playerName = ocrText.match(/(?:NAME|Name)?\s*([A-Z][a-z]+\s[A-Z][a-z]+)/)?.[1] as any;
        positionCode = ocrText.match(/\b(QB|WR|TE|RB|LB|CB|S|OL|DL)\b/)?.[1] as any;
        ovrText = ocrText.match(/OVR\s*:?[\s]?(\d{2,3})/)?.[1] as any;
      }

      if (!playerName || !positionCode || !ovrText) {
        throw new BadRequestException('Failed to extract player data from image');
      }

      // if (!Object.values(POSTION_CODE).includes(positionCode.toUpperCase() as POSTION_CODE)) {
      //   throw new BadRequestException(`Invalid position code: ${positionCode}`);
      // }

      const ovr = parseInt(ovrText, 10);

      return {
        playerName: playerName.trim(),
        positionCode: positionCode.trim().toUpperCase() as POSTION_CODE,
        ovr,
      };
    } catch (error) {
      console.error('OCR Extraction Error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('OCR parsing failed: ' + error.message);
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
