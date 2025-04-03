import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as ocr from "@google-cloud/vision";
import { ConfigService } from "@nestjs/config";
import { CloudinaryService } from "src/modules/cloudinary/cloudinary.service";
import { PlayerEntity, PlayerImageEntity, PlayerAttributesEntity } from "../entity/players.entity";
import { userEntity } from "src/modules/user/entity/user.entity";
import { PlayerPositionEntity } from "../entity/player-position.entity";
import { POSTION_CODE } from "src/types/enums/roles";

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
    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {
    const credentialsPath = this.configService.get<string>('OCR_KEY_FILE');
    if (!credentialsPath) {
      throw new InternalServerErrorException('OCR_KEY_FILE not configured');
    }
    this.ocrClient = new ocr.ImageAnnotatorClient({ keyFilename: credentialsPath });
  }

  async processPlayerImage(
    file: Express.Multer.File,
    userId: number
  ): Promise<PlayerEntity> {
    let uploadResult: any;
    const queryRunner = this.playerRepo.manager.connection.createQueryRunner();

    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      uploadResult = await this.cloudinaryService.uploadFile(file);
      if (uploadResult.error || !uploadResult.secure_url) {
        throw new InternalServerErrorException('Cloudinary upload failed');
      }

      const ocrText = await this.extractTextFromImage(uploadResult.secure_url);

      const { playerName, positionCode } = this.parseOcrData(ocrText);

      const position = await this.validatePosition(positionCode);

      await queryRunner.connect();

      await queryRunner.startTransaction();

      let player = await this.playerRepo.findOne({
        where: { name: playerName },
        relations: ['attributes']
      });

      if (!player) {
        const newPlayer = this.playerRepo.create({
          name: playerName,
          user: { id: userId },
          position: { id: position.id },
        });
        player = await queryRunner.manager.save(PlayerEntity, newPlayer);
      }

      const attributes = this.processConversionLogic(positionCode, ocrText);

      const playerAttributes = this.playerAttrRepo.create({
        ...attributes,
        player: { id: player.id }
      });
      await queryRunner.manager.save(PlayerAttributesEntity, playerAttributes);

      const playerImage = this.playerImageRepo.create({
        url: uploadResult.secure_url,
        player: { id: player.id }
      });
      await queryRunner.manager.save(PlayerImageEntity, playerImage);

      await queryRunner.commitTransaction();

      const foundPlayer = await this.playerRepo.findOne({
        where: { id: player.id },
        relations: ['attributes', 'images']
      });

      if (!foundPlayer) {
        throw new NotFoundException(`Player with ID ${player.id} not found`);
      }

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

  private async extractTextFromImage(imageUrl: string): Promise<string> {
    try {
      const [result] = await this.ocrClient.textDetection(imageUrl);

      return result.textAnnotations?.[0]?.description || '';

    } catch (error) {

      throw new InternalServerErrorException('OCR processing failed');
    }
  }

  private parseOcrData(ocrText: string): { playerName: string; positionCode: POSTION_CODE } {

    const nameMatch = ocrText.match(/NAME:\s*(.+)/i);

    const posMatch = ocrText.match(/POS:\s*([A-Z]{1,3})/i);

    if (!nameMatch || !posMatch) {
      throw new BadRequestException('Unable to parse NAME or POS from OCR text');
    }

    const playerName = nameMatch[1].trim();
    const positionCode = posMatch[1].trim().toUpperCase() as POSTION_CODE;

    return { playerName, positionCode };
  }


  private async validatePosition(positionCode: string): Promise<PlayerPositionEntity> {
    const position = await this.playerPositionRepo.findOne({
      where: { code: positionCode }
    });

    if (!position) {
      throw new NotFoundException(`Position ${positionCode} not found`);
    }
    return position;
  }

  private processConversionLogic(
    positionCode: POSTION_CODE,
    ocrText: string,
  ): Partial<PlayerAttributesEntity> {
    const extractValue = (key: string): number => {
      const regex = new RegExp(`${key}:\\s*(\\d+)`);
      const match = ocrText.match(regex);
      return match ? parseInt(match[1], 10) : 0;
    };

    const baseConversion = (value: number, modifiers: number[]): number => {
      return value + modifiers.reduce((a, b) => a + b, 0);
    };

    switch (positionCode) {
      case POSTION_CODE.TightEnd:
        return {
          speed: baseConversion(extractValue('Speed'), [0]),
          acceleration: baseConversion(extractValue('Acceleration'), [2]),
          agility: baseConversion(extractValue('Agility'), [1]),
          change_of_direction: baseConversion(extractValue('Change of Direction'), [3]),
          strength: baseConversion(extractValue('Strength'), [-3]),
          awareness: baseConversion(extractValue('Awareness'), [-4]),
        };
      default:
        throw new BadRequestException(`${positionCode} Not Found`);
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
