// Keep your imports the same
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DeepPartial } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { PlayerEntity, PlayerImageEntity } from '../entity/players.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import { OpenAI } from 'openai';
import { COLLAGE_AGE_ENUM } from 'src/types/enums/roles';

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

  private parseHeightString(heightStr: string): number | null {
    if (!heightStr) return null;
    const match = heightStr.match(/(\d+)[']\s*(\d+)?/);
    if (!match) return null;
    const feet = parseInt(match[1], 10) || 0;
    const inches = match[2] ? parseInt(match[2], 10) : 0;
    return feet * 12 + inches;
  }

  private parseWeightString(weightStr: string): number | null {
    if (!weightStr) return null;
    const num = parseInt(weightStr.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? null : num;
  }

  private extractDraftRound(reason: string): string | any {
    if (!reason) return null;
    const match = reason.match(/Projected Round (\d+)/i);
    return match ? match[1] : null;
  }

  private normalizeClassString(input: string): COLLAGE_AGE_ENUM | null {
    const normalized = input.toUpperCase().replace(/\s/g, '');
    const map: Record<string, COLLAGE_AGE_ENUM> = {
      'SOR(S)': COLLAGE_AGE_ENUM.SO_RS,
      'JR': COLLAGE_AGE_ENUM.JR,
      'JR(RS)': COLLAGE_AGE_ENUM.JR_RS,
      'SR': COLLAGE_AGE_ENUM.SR,
      'SR(RS)': COLLAGE_AGE_ENUM.SR_RS,
    };

    return map[normalized] ?? null;
  }

  async processPlayerImage(files: Express.Multer.File[], userId: number): Promise<any> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const primaryFile = files[0];
    const attributeFiles = files.slice(1);

    let uploadResult: any;
    const queryRunner: QueryRunner = this.playerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      uploadResult = await this.cloudinaryService.uploadFile(primaryFile);
      if (!uploadResult?.secure_url) {
        throw new InternalServerErrorException('Primary image upload failed');
      }

      const structuredData = await this.extractStructuredPlayerData(primaryFile);
      const { NAME, POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, REASON } = structuredData;

      if (!NAME || !POS || !OVR) {
        throw new BadRequestException('Missing required player fields in image (NAME, POS, OVR)');
      }

      const existing = await this.playerRepo.findOne({ where: { name: NAME } });
      // Optional: skip duplicates
      // if (existing) throw new BadRequestException(`Player "${NAME}" already exists.`);

      const position = await this.playerPositionRepo.findOne({ where: { code: POS } });
      if (!position) {
        throw new NotFoundException(`Position "${POS}" not found.`);
      }

      const parsedHeight = this.parseHeightString(HEIGHT);
      const parsedWeight = this.parseWeightString(WEIGHT);
      const normalizedClassEnum = this.normalizeClassString(CLASS || structuredData.YEAR || '');

      const newPlayerData: DeepPartial<PlayerEntity> = {
        name: NAME!,
        overallRating: parseInt(OVR, 10),
        height: parsedHeight ?? null,
        weight: parsedWeight ?? null,
        homeTown: HOMETOWN ?? null,
        playerClass: normalizedClassEnum ? normalizedClassEnum : undefined,
        projectedReason: this.extractDraftRound(REASON),
        user: { id: userId } as any,
        position: { id: position.id } as any,
      };

      const newPlayer = this.playerRepo.create(newPlayerData);
      const player: PlayerEntity = await queryRunner.manager.save(PlayerEntity, newPlayer);

      const playerImage = this.playerImageRepo.create({
        url: uploadResult.secure_url,
        player,
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

          this.logger.log(`Queued attribute image: ${file.originalname}`);
          return { file: file.originalname, status: 'queued' };
        } catch (err) {
          this.logger.error(`Error queuing file at index ${index}: ${err.message}`);
          return { file: file.originalname, status: 'error', error: err.message };
        }
      });

      const queueResults = await Promise.allSettled(uploadPromises);
      await queryRunner.commitTransaction();

      return {
        message: `Player "${NAME}" created successfully. Attributes queued: ${attributeFiles.length}`,
        playerId: player.id,
        class: normalizedClassEnum,
        projectedReason: this.extractDraftRound(REASON),
        imagesQueued: queueResults.map((r) =>
          r.status === 'fulfilled' ? r.value : r.reason,
        ),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (uploadResult?.public_id) {
        await this.cloudinaryService.deleteFile(uploadResult.public_id);
      }

      this.logger.error(`Player creation failed: ${error.message}`);
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
            content:
              'You are a helpful assistant that ONLY returns raw valid JSON. Do not add commentary, markdown, or any explanation. Format: {"NAME": "", "POS": "", "OVR": "", "CLASS": "", "HEIGHT": "", "WEIGHT": "", "HOMETOWN": "", "REASON": "", "TENDENCY": ""}. Use the exact CLASS format shown on screen, e.g. "SR(RS)".',
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
                text: "Extract the player's data shown on the right side of the screen.",
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const raw = response.choices[0]?.message?.content ?? '';
      const cleaned = raw
        .replace(/```json|```/gi, '')
        .replace(/[^\x20-\x7E]+/g, '') // remove non-printable
        .trim();

      const parsed = JSON.parse(cleaned);
      console.log('🧠 GPT Structured Output:', parsed);

      // Backup fallback
      if (!parsed.CLASS && parsed.YEAR) {
        parsed.CLASS = parsed.YEAR.trim().toUpperCase();
      }

      return parsed;
    } catch (error) {
      console.error('OpenAI GPT-4o error:', error);
      throw new InternalServerErrorException('Failed to extract structured data using GPT-4o.');
    }
  }

  async extractAttributesbasedOnPosition(prompt: string) {
    // To be implemented
  }
}
