import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { PlayerAttributesEntity, PlayerEntity, PlayerImageEntity } from '../entity/players.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import { COLLAGE_AGE_ENUM, POSTION_CODE, CollageAgeMapping } from 'src/types/enums/roles';
import { OpenAI } from 'openai';
import { WideReceiverDto } from '../dto/convert-manually.dto';

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

  private extractDraftRound(reason: string): number | null {
    if (!reason) return null;
    const match = reason.match(/(?:Projected Round|Round)\s*(\d+)/i) ||
      reason.match(/Pro Draft \(Projected Round (\d+)\)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  private normalizeClassString(input: string): COLLAGE_AGE_ENUM | null {
    if (!input) return null;
    const normalized = input.toUpperCase().replace(/\s/g, '');
    const map: Record<string, COLLAGE_AGE_ENUM> = {
      'SO(RS)': COLLAGE_AGE_ENUM.SO_RS,
      'SORS': COLLAGE_AGE_ENUM.SO_RS,
      'JR': COLLAGE_AGE_ENUM.JR,
      'JR(RS)': COLLAGE_AGE_ENUM.JR_RS,
      'JRRS': COLLAGE_AGE_ENUM.JR_RS,
      'SR': COLLAGE_AGE_ENUM.SR,
      'SR(RS)': COLLAGE_AGE_ENUM.SR_RS,
      'SRRS': COLLAGE_AGE_ENUM.SR_RS,
    };
    return map[normalized] ?? null;
  }

  async callGptOcr(imageUrl: string, prompt?: string): Promise<any> {
    try {
      const strictPrompt = prompt ?
        `${prompt} ONLY return the requested JSON format with NUMERIC values. No explanations or extra text.` :
        `Extract ONLY the player attributes visible in the image. Return ONLY a clean JSON object with attribute names exactly as they appear and numeric values.`;

      const messages: any = [
        {
          role: 'system',
          content: 'You are a precision football attribute extractor. Return only valid JSON with numeric values for attributes. No explanations or text outside the JSON.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: strictPrompt
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ];

      const response = await this.openAI.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content ?? '';
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('GPT Attribute OCR error:', error);
      throw new InternalServerErrorException('Failed to extract attributes from image.');
    }
  }

  private safeGetWithAdjustment(
    data: Record<string, number>,
    possibleKeys: string[],
    defaultValue: number,
    adjustment: number
  ): number {
    for (const key of possibleKeys) {
      if (data[key] !== undefined && data[key] !== null) {
        return Math.min(100, Math.max(0, data[key] + adjustment));
      }
    }
    return defaultValue;
  }

  // Update the convertAttributes method
  async convertAttributes(
    rawData: any,
    positionCode: string,
    player: PlayerEntity
  ): Promise<Partial<PlayerAttributesEntity>> {
    this.logger.log(`Converting attributes for ${player.name} (${positionCode})`, rawData);

    // Default values
    const draft_round = player.projectedReason ? parseInt(player.projectedReason, 10) || 1 : 1;
    const collegeYearKey = player.playerClass;
    const collegeYearAge = CollageAgeMapping[collegeYearKey] ?? 0;
    const calculatedAge = Math.floor(Math.random() * 2) + 17 + collegeYearAge;

    let adjustedData: Partial<PlayerAttributesEntity> = { age: calculatedAge };

    // Improved helper function with proper typing
    const getAdjustedValue = <T extends object>(
      data: T,
      key: keyof T,
      adjustment: number
    ): number | undefined => {  // Changed from null to undefined to match PlayerAttributesEntity
      const value = data[key];
      if (value !== undefined && value !== null) {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
          return Math.min(100, Math.max(0, numericValue + adjustment));
        }
      }
      return undefined;  // Matches PlayerAttributesEntity's optional fields
    };

    // Position-specific adjustments
    switch (positionCode) {
      case POSTION_CODE.WiderReceiver: {
        const data = rawData as WideReceiverDto;

        // Use non-null assertion for required fields
        adjustedData = {
          ...adjustedData,
          speed: getAdjustedValue(data, 'speed', -2) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', 0) ?? undefined,
          agility: getAdjustedValue(data, 'agility', 0) ?? undefined,
          change_of_direction: getAdjustedValue(data, 'change_of_direction', -1) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -9) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -15 - draft_round) ?? undefined,
          break_tackle: getAdjustedValue(data, 'break_tackle', -3 - draft_round) ?? undefined,
          catch_in_traffic: getAdjustedValue(data, 'catch_in_traffic', -10 - draft_round) ?? undefined,
          spectacular_catch: getAdjustedValue(data, 'spectacular_catch', -5 - draft_round) ?? undefined,
          release: getAdjustedValue(data, 'release', -13 - draft_round) ?? undefined,
          jumping: getAdjustedValue(data, 'jumping', -3) ?? undefined,
          carrying: getAdjustedValue(data, 'carrying', -14 - draft_round) ?? undefined,
          trucking: getAdjustedValue(data, 'trucking', -21 - draft_round) ?? undefined,
          ball_carrier_vision: getAdjustedValue(data, 'ball_carrier_vision', -15 - draft_round) ?? undefined,
          catching: getAdjustedValue(data, 'catching', -9 - draft_round) ?? undefined,
          stiff_arm: getAdjustedValue(data, 'stiff_arm', -7 - draft_round) ?? undefined,
          spin_move: getAdjustedValue(data, 'spin_move', -5 - draft_round) ?? undefined,
          juke_move: getAdjustedValue(data, 'juke_move', -3 - draft_round) ?? undefined,
          short_route_running: getAdjustedValue(data, 'short_route_running', -11 - draft_round) ?? undefined,
          medium_route_running: getAdjustedValue(data, 'medium_route_running', -16 - draft_round) ?? undefined,
          deep_route_running: getAdjustedValue(data, 'deep_route_running', -17 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          return: getAdjustedValue(data, 'return', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined
        };
        break;
      }
      // Add other position cases here
    }

    // Remove undefined values (but keep 0 values)
    Object.keys(adjustedData).forEach(key => {
      if (adjustedData[key as keyof PlayerAttributesEntity] === undefined) {
        delete adjustedData[key as keyof PlayerAttributesEntity];
      }
    });

    return adjustedData;
  }
  async handleAttributeExtractionResults(
    gptData: any,
    positionCode: string,
    playerId: number,
  ): Promise<any> {
    if (!gptData || !positionCode || !playerId) {
      throw new BadRequestException('Missing GPT data or required parameters.');
    }

    const player = await this.playerRepo.findOne({
      where: { id: playerId },
      relations: ['position'],
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    const convertedAttributes = await this.convertAttributes(gptData, positionCode, player);

    let existingAttrs = await this.playerAttrRepo.findOne({
      where: { player: { id: playerId } },
    });

    if (!existingAttrs) {
      const newAttrs = this.playerAttrRepo.create({
        ...convertedAttributes,
        player: { id: playerId },
      });
      existingAttrs = await this.playerAttrRepo.save(newAttrs);
    } else {
      Object.assign(existingAttrs, convertedAttributes);
      await this.playerAttrRepo.save(existingAttrs);
    }

    return {
      message: `Attributes processed for ${player.name}`,
      result: convertedAttributes,
    };
  }

  async extractStructuredPlayerData(file: Express.Multer.File): Promise<any> {
    try {
      const base64Image = file.buffer.toString('base64');
      const response = await this.openAI.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Extract ONLY the player bio information visible in the image. Return ONLY as JSON with these exact keys: NAME, POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, REASON. If information is not visible in the image, set those fields to null or empty string.'
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
                text: "Extract the player's bio data. Only return the JSON without explanations.",
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content ?? '';
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('GPT-4o extraction error:', error);
      throw new InternalServerErrorException('Failed to extract structured data.');
    }
  }

  private async identifyImageType(file: Express.Multer.File): Promise<{
    type: 'bio' | 'attribute';
    data: any;
  }> {
    const data = await this.extractStructuredPlayerData(file);
    const bioCriteria = data.NAME && data.POS && data.OVR &&
      (data.HEIGHT || data.WEIGHT || data.HOMETOWN || data.CLASS);
    return bioCriteria ? { type: 'bio', data } : { type: 'attribute', data };
  }

  async processPlayerImage(files: Express.Multer.File[], userId: number): Promise<any> {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    const fileProcessingResults = await Promise.all(
      files.map(async file => {
        const result = await this.identifyImageType(file);
        return { file, ...result };
      })
    );

    const bioImageResult = fileProcessingResults.find(result => result.type === 'bio');
    if (!bioImageResult) {
      throw new BadRequestException('Missing required player bio image');
    }

    const primaryFile = bioImageResult.file;
    const bioData = bioImageResult.data;
    const attributeFiles = fileProcessingResults
      .filter(result => result !== bioImageResult)
      .map(result => result.file);

    const queryRunner = this.playerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uploadResult = await this.cloudinaryService.uploadFile(primaryFile);
      if (!uploadResult?.secure_url) {
        throw new Error('Primary image upload failed');
      }

      const { NAME, POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, REASON } = bioData;
      const position = await this.playerPositionRepo.findOne({ where: { code: POS } });
      if (!position) {
        throw new NotFoundException(`Position "${POS}" not found`);
      }

      const draftRound = this.extractDraftRound(REASON);
      const playerClass = this.normalizeClassString(CLASS || '');

      const playerData: DeepPartial<PlayerEntity> = {
        name: NAME,
        overallRating: parseInt(OVR, 10) || undefined,
        height: this.parseHeightString(HEIGHT),
        weight: this.parseWeightString(WEIGHT),
        homeTown: HOMETOWN ?? null,
        playerClass: playerClass as any,
        projectedReason: draftRound !== null ? draftRound.toString() : undefined,
        user: { id: userId } as any,
        position: { id: position.id } as any,
      };

      const player = await queryRunner.manager.save(
        PlayerEntity,
        this.playerRepo.create(playerData)
      );

      await queryRunner.manager.save(
        PlayerImageEntity,
        this.playerImageRepo.create({
          url: uploadResult.secure_url,
          player,
        })
      );
      const uploadPromises = attributeFiles.map(async (file) => {
        const result = await this.cloudinaryService.uploadFile(file);
        if (!result?.secure_url) {
          throw new Error('Attribute image upload failed');
        }

        const job = await this.imageQueue.add(
          'processImage',
          {
            userId,
            playerId: player.id,
            imageUrl: result.secure_url,
            originalName: file.originalname,
            positionCode: POS,
          },
          {
            delay: 1000,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          }
        );

        return {
          file: file.originalname,
          status: 'queued',
          jobId: job.id
        };
      });

      const queueResults = await Promise.allSettled(uploadPromises);

      // Get the completed jobs
      const completedJobs = await Promise.all(
        queueResults
          .filter(r => r.status === 'fulfilled')
          .map(async r => {
            const job = await this.imageQueue.getJob((r as PromiseFulfilledResult<any>).value.jobId);
            return job;
          })
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        player: {
          id: player.id,
          name: NAME,
          position: POS,
          overallRating: parseInt(OVR, 10) || null,
          class: playerClass,
          height: HEIGHT,
          weight: WEIGHT,
          homeTown: HOMETOWN,
          draftProjection: REASON,
          imageUrl: uploadResult.secure_url,
        },
        attributes: {
          pending: attributeFiles.length - completedJobs.length,
          processed: completedJobs.length,
        },
        queueStatus: queueResults.map(r =>
          r.status === 'fulfilled' ? r.value : { error: (r.reason as Error).message }
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
}