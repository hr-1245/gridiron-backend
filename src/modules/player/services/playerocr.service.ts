import { Injectable, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as ocr from "@google-cloud/vision";
import { ConfigService } from "@nestjs/config";
import { CloudinaryService } from "src/modules/cloudinary/cloudinary.service";
import { PlayerEntity, PlayerImageEntity } from "../entity/players.entity";
import { userEntity } from "src/modules/user/entity/user.entity";
import { PlayerPositionEntity } from "../entity/player-position.entity";
import { ConversionDto } from "../dto/convert-manually.dto";

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
    // Get the path from the environment variable "OCR_KEY_FILE"
    const credentialsPath = this.configService.get<string>('OCR_KEY_FILE');
    if (!credentialsPath) {
      throw new InternalServerErrorException('OCR_KEY_FILE not configured');
    }
    this.ocrClient = new ocr.ImageAnnotatorClient({ keyFilename: credentialsPath });
  }

  /**
   * Upload the file to Cloudinary and store the image record in the database.
   */
  async uploadFile(file: Express.Multer.File, playerId: number) {
    const uploadResponse = await this.cloudinaryService.uploadFile(file);
    if (!uploadResponse?.secure_url) {
      throw new NotFoundException('Failed to upload image to Cloudinary');
    }
    const uploadedImage = this.playerImageRepo.create({
      player: { id: playerId },
      url: uploadResponse.secure_url,
    });
    return await this.playerImageRepo.save(uploadedImage);
  }

  /**
   * Process the image file:
   *  - Uploads file to Cloudinary.
   *  - Verifies position and finds/creates the Player record.
   *  - Saves the image record.
   *  - Runs OCR on the file buffer.
   *  - Parses the OCR text for attributes.
   *  - Returns the Cloudinary URL, extracted text, parsed attributes, and player info.
   */
  async processImage(
    file: Express.Multer.File,
    conversionData: ConversionDto,
  ): Promise<any> {
    try {
      const maxSize = 10485760;
      if (file.size > maxSize) {
        throw new InternalServerErrorException(
          `File size too large. Got ${file.size}. Maximum allowed is ${maxSize} bytes.`,
        );
      }

      // Upload file to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      if (!uploadResult?.secure_url) {
        throw new NotFoundException('Failed to upload image to Cloudinary');
      }

      // Validate that the provided position exists
      const { positionId, positionCode, playerName, draft_round } = conversionData;
      const position = await this.playerPositionRepo.findOne({
        where: { id: positionId, code: positionCode },
      });
      if (!position) {
        throw new NotFoundException('Invalid position or position code.');
      }

      // Find or create a Player record for the authenticated user
      let player = await this.playerRepo.findOne({
        where: {
          name: playerName,
        },
      });
      if (!player) {
        const newPlayer = this.playerRepo.create({
          name: playerName,
          position: { id: positionId },
        });
        player = await this.playerRepo.save(newPlayer);
      }

      // Save the image record in the database
      const playerImage = await this.uploadFile(file, player.id);

      // Run OCR on the file buffer
      const [ocrResult] = await this.ocrClient.textDetection({
        image: { content: file.buffer },
      });
      const detections = ocrResult.textAnnotations;
      if (!detections || detections.length === 0) {
        throw new NotFoundException('No text detected in the image.');
      }
      const extractedText = detections[0].description;
      console.log('Extracted OCR Text:', extractedText);

      // Parse the extracted text for attributes (sample logic)
      const parsedAttributes = {
        playerName: extractedText?.match(/([A-Z][a-z]+)\s([A-Z][a-z]+)/)?.[0] || 'Unknown',
        position: extractedText?.match(/\b(QB|WR|TE|RB|LB|CB|S|OL|DL)\b/)?.[0] || 'Unknown',
        agility: extractedText?.match(/Agility\s+(\d+)/)?.[1] || 'N/A',
        jumping: extractedText?.match(/Jumping\s+(\d+)/)?.[1] || 'N/A',
        // Add more extractions as needed
      };

      return {
        message: 'Image processed successfully',
        imageUrl: uploadResult.secure_url,
        extractedText,
        parsedAttributes,
        player,
      };
    } catch (error) {
      console.error('OCR Processing Error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
