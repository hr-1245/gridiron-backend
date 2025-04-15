import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import {
  PlayerAttributesEntity,
  PlayerEntity,
  PlayerImageEntity,
} from '../entity/players.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import {
  COLLAGE_AGE_ENUM,
  CollageAgeMapping,
  POSTION_CODE,
} from 'src/types/enums/roles';
import { OpenAI } from 'openai';
import { QuarterBackDto, WideReceiverDto } from '../dto/convert-manually.dto';

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

    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,

    @InjectQueue('imageProcessing')
    private readonly imageQueue: Queue,

    private readonly cloudinaryService: CloudinaryService,

    private readonly configService: ConfigService,
  ) {
    this.openAI = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_KEY'),
    });
  }

  // Helper function to parse height and weight
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

  // Helper function to extract draft round from a string
  private extractDraftRound(reason: string): number | null {
    if (!reason) return null;
    const match = reason.match(/(?:Projected Round|Round)\s*(\d+)/i) ||
      reason.match(/Pro Draft \(Projected Round (\d+)\)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  // Normalize class string to enum value
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

  // Main function to call GPT-4 for OCR data extraction
  async callGptOcr(imageUrl: string, prompt?: string): Promise<any> {
    try {
      const strictPrompt = prompt ?
        `${prompt} Return ONLY the JSON object with exact attribute names shown. Skip any attributes not visible. Don't include explanations or markdown.` :
        `Extract all visible football player attributes. Return ONLY raw JSON with exact attribute names and numeric values. No commentary.`;

      const messages: any = [
        {
          role: 'system',
          content: 'You are a precision football attribute extractor. Only return valid JSON with exact attribute names and values from the image.'
        },
        {
          role: 'user',
          content: `${strictPrompt} Image URL: ${imageUrl}`
        }
      ];

      const response = await this.openAI.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const raw = response.choices[0]?.message?.content ?? '';
      const cleaned = raw.replace(/```json|```/gi, '').trim();

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        this.logger.error('Failed to parse GPT response', { raw });
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      this.logger.error('GPT Attribute OCR error:', error);
      throw new InternalServerErrorException('Failed to extract attributes from image.');
    }
  }

  // Handle the results from GPT and store the data in the database
  async handleAttributeExtractionResults(
    gptData: any,
    positionCode: string,
    playerId: number,
  ): Promise<any> {
    if (!gptData || !positionCode || !playerId) {
      throw new BadRequestException('Missing GPT data or required parameters.');
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }
    return this.convertAndSaveAttributes(gptData, positionCode, player);
  }

  // Extract structured player data from image
  async extractStructuredPlayerData(file: Express.Multer.File) {
    try {
      const base64Image = file.buffer.toString('base64');
      const response = await this.openAI.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that ONLY returns raw valid JSON. Format: {"NAME": "", "POS": "", "OVR": "", "CLASS": "", "HEIGHT": "", "WEIGHT": "", "HOMETOWN": "", "REASON": ""}. Use exact CLASS format like "SR(RS)".',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${base64Image}` },
              },
              {
                type: 'text',
                text: "Extract the player's bio data shown on the right side.",
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const raw = response.choices[0]?.message?.content ?? '';
      const cleaned = raw.replace(/```json|```/gi, '').replace(/[^\x20-\x7E]+/g, '').trim();
      const parsed = JSON.parse(cleaned);
      console.log(parsed)
      if (!parsed.CLASS && parsed.YEAR) {
        parsed.CLASS = parsed.YEAR.trim().toUpperCase();
      }

      return parsed;
    } catch (error) {
      this.logger.error('GPT-4o extraction error:', error);
      throw new InternalServerErrorException('Failed to extract structured data.');
    }
  }

  async processPlayerImage(files: Express.Multer.File[], userId: number): Promise<any> {
    if (!files?.length) throw new BadRequestException('No files uploaded');

    let primaryFile: Express.Multer.File | null = null;
    const attributeFiles: Express.Multer.File[] = [];

    for (const file of files) {
      const data = await this.extractStructuredPlayerData(file);
      if (data?.NAME && data?.POS && data?.OVR && !primaryFile) {
        primaryFile = file;
        Object.assign(file, { structuredData: data });
      } else {
        attributeFiles.push(file);
      }
    }

    if (!primaryFile) throw new BadRequestException('Missing required bio data in primary image');

    const queryRunner = this.playerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uploadResult = await this.cloudinaryService.uploadFile(primaryFile);
      if (!uploadResult?.secure_url) throw new Error('Primary image upload failed');

      const { NAME, POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, REASON } =
        (primaryFile as any).structuredData;

      const position = await this.playerPositionRepo.findOne({ where: { code: POS } });
      if (!position) throw new NotFoundException(`Position "${POS}" not found`);

      const draftRound: any = this.extractDraftRound(REASON);
      const playerData: DeepPartial<PlayerEntity> = {
        name: NAME,
        overallRating: parseInt(OVR, 10),
        height: this.parseHeightString(HEIGHT),
        weight: this.parseWeightString(WEIGHT),
        homeTown: HOMETOWN ?? null,
        playerClass: this.normalizeClassString(CLASS || '') as any,
        projectedReason: draftRound,
        user: { id: userId } as any,
        position: { id: position.id } as any,
      };

      const player = await queryRunner.manager.save(PlayerEntity, this.playerRepo.create(playerData));
      await queryRunner.manager.save(PlayerImageEntity, this.playerImageRepo.create({
        url: uploadResult.secure_url,
        player,
      }));

      const uploadPromises = attributeFiles.map(async (file) => {
        const result = await this.cloudinaryService.uploadFile(file);
        if (!result?.secure_url) throw new Error('Attribute image upload failed');

        await this.imageQueue.add('processImage', {
          userId,
          playerId: player.id,
          imageUrl: result.secure_url,
          originalName: file.originalname,
          positionCode: POS,
        });

        return { file: file.originalname, status: 'queued' };
      });

      const queueResults = await Promise.allSettled(uploadPromises);
      await queryRunner.commitTransaction();

      return {
        success: true,
        player: {
          id: player.id,
          name: NAME,
          position: POS,
          overallRating: parseInt(OVR, 10),
          class: this.normalizeClassString(CLASS || ''),
          height: HEIGHT,
          weight: WEIGHT,
          homeTown: HOMETOWN,
          draftProjection: REASON,
          imageUrl: uploadResult.secure_url,
        },
        attributes: {
          pending: attributeFiles.length,
          processed: 0, // Will be updated by queue processor
        },
        queueStatus: queueResults.map(r =>
          r.status === 'fulfilled' ? r.value : { error: r.reason.message }
        ),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Player creation failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Convert and save attributes to DB with logic based on position
  async convertAndSaveAttributes(rawData: any, positionCode: string, player: PlayerEntity) {
    try {
      const draft_round = rawData.draft_round || rawData.draftRound || 1;
      const collegeYearKey = this.normalizeClassString(rawData.CLASS || rawData.YEAR || '') as any;
      const collegeYearAge = CollageAgeMapping[collegeYearKey] ?? 0;
      const calculatedAge = Math.floor(Math.random() * 2) + 17 + collegeYearAge;

      let adjustedData: Record<string, any> = {
        age: calculatedAge,
      };

      switch (positionCode) {
        case POSTION_CODE.WiderReceiver: {
          const data = rawData as WideReceiverDto;

          adjustedData = {
            age: calculatedAge,
            speed: Math.max(0, data.speed - 2), // Prevent negative values
            acceleration: Math.max(0, data.acceleration),
            agility: Math.max(0, data.agility),
            change_of_direction: Math.max(0, data.change_of_direction - 1),
            strength: Math.max(0, data.strength - 9),
            awareness: Math.max(0, data.awareness - 15 - draft_round),
            break_tackle: Math.max(0, data.break_tackle - 3 - draft_round),
            catch_in_traffic: Math.max(0, data.catch_in_traffic - 10 - draft_round),
            spectacular_catch: Math.max(0, data.spectacular_catch - 5 - draft_round),
            release: Math.max(0, data.release - 13 - draft_round),
            jumping: Math.max(0, data.jumping - 3),
            carrying: Math.max(0, data.carrying - 14 - draft_round),
            trucking: Math.max(0, data.trucking - 21 - draft_round),
            ball_carrier_vision: Math.max(0, data.ball_carrier_vision - 15 - draft_round),
            catching: Math.max(0, data.catching - 9 - draft_round),
            stiff_arm: Math.max(0, data.stiff_arm - 7 - draft_round),
            spin_move: Math.max(0, data.spin_move - 5 - draft_round),
            juke_move: Math.max(0, data.juke_move - 3 - draft_round),
            short_route_running: Math.max(0, data.short_route_running - 11 - draft_round),
            medium_route_running: Math.max(0, data.medium_route_running - 16 - draft_round),
            deep_route_running: Math.max(0, data.deep_route_running - 17 - draft_round),
            stamina: Math.max(0, data.stamina - 1),
            return: Math.max(0, data.return - 1),
            injury: Math.max(0, data.injury - 1),
          };
          break;
        }

        case POSTION_CODE.QuarterBack: {
          const data = rawData as QuarterBackDto;

          adjustedData = {
            age: calculatedAge,
            speed: Math.max(0, data.speed - 2),
            acceleration: Math.max(0, data.acceleration - 2),
            agility: Math.max(0, data.agility - 5),
            awareness: Math.max(0, data.awareness - 10 - draft_round),
            throw_power: Math.max(0, data.throw_power - 1),
            throw_accuracy_short: Math.max(0, data.throw_accuracy_short - 7 - draft_round),
            throw_accuracy_deep: Math.max(0, data.throw_accuracy_deep - 14 - draft_round),
            throw_on_the_run: Math.max(0, data.throw_on_the_run - 8 - draft_round),
            throw_under_pressure: Math.max(0, data.throw_under_pressure - 11 - draft_round),
            play_action: Math.max(0, data.play_action - 15 - draft_round),
            break_sack: Math.max(0, data.break_sack - 9 - draft_round),
            break_tackle: Math.max(0, data.break_tackle - 4 - draft_round),
            trucking: Math.max(0, data.trucking - 13 - draft_round),
            carrying: Math.max(0, data.carrying - 26 - draft_round),
            ball_carrier_vision: Math.max(0, data.ball_carrier_vision - 13 - draft_round),
            stiff_arm: Math.max(0, data.stiff_arm - 7 - draft_round),
            spin_move: Math.max(0, data.spin_move - 14 - draft_round),
            juke_move: Math.max(0, data.juke_move - 10 - draft_round),
            stamina: Math.max(0, data.stamina - 2),
            injury: Math.max(0, data.injury - 1),

          };

          break;
        }

        default:
          this.logger.warn(`No attribute logic defined for position ${positionCode}`);
          return {
            status: 'skipped',
            reason: `Unsupported position: ${positionCode}`,
            playerId: player.id,
          };
      }

      // Ensure the attributes are within 0-100 range
      Object.keys(adjustedData).forEach((key) => {
        const val = adjustedData[key];
        if (typeof val === 'number') {
          adjustedData[key] = Math.min(100, Math.max(0, val));
        }
      });

      const savedEntity = this.playerAttrRepo.create({
        ...adjustedData,
        player: { id: player.id },
      });

      const saved = await this.playerAttrRepo.save(savedEntity);

      // Return only non-null/defined keys
      const cleanedResult = Object.keys(saved).reduce((acc, key) => {
        if (saved[key] !== null && saved[key] !== undefined) {
          acc[key] = saved[key];
        }
        return acc;
      }, {} as Record<string, any>);

      return {
        message: `Conversion of ${positionCode} successful`,
        result: cleanedResult,
      };

    } catch (error) {
      this.logger.error(`Conversion failed for ${positionCode}`, error.stack);
      throw new InternalServerErrorException(`Conversion failed: ${error.message}`);
    }
  }
}
