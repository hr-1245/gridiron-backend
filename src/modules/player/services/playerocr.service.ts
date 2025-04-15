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
  PositionAttributeMappingEntity,
} from '../entity/players.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import {
  COLLAGE_AGE_ENUM,
  CollageAgeMapping,
  POSTION_CODE,
} from 'src/types/enums/roles';
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
    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,
    @InjectRepository(PositionAttributeMappingEntity)
    private readonly mappingRepo: Repository<PositionAttributeMappingEntity>,
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

  async callGptOcr(imageUrl: string, prompt?: string): Promise<any> {
    try {
      const messages: any[] = [
        {
          role: 'system',
          content: prompt || 'You are a helpful assistant that ONLY returns raw valid JSON. Do not add commentary, markdown, or explanation. Just JSON.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: prompt ? 'Extract the requested attributes.' : 'Extract all Madden-style attributes from this image.',
            },
          ],
        },
      ];

      const response = await this.openAI.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.1,
        max_tokens: 800,
      });

      const raw = response.choices[0]?.message?.content ?? '';
      const cleaned = raw.replace(/```json|```/gi, '').replace(/[^\x20-\x7E]+/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.error('GPT Attribute OCR error:', error);
      throw new InternalServerErrorException('Failed to extract attributes from image.');
    }
  }

  async extractWideReceiverAttributes(imageUrl: string): Promise<any> {
    const prompt = `Extract all visible Madden-style WR attributes including:
    - Route Running (and sub-attributes: Deep, Medium, Short)
    - Hands (and sub-attributes: Catching, Spectacular Catch, Catch in Traffic)
    - Elusiveness, Power, Quickness
    - Awareness, Ball Carrier Vision
    Return ONLY raw JSON with exact attribute names and values.`;

    return this.callGptOcr(imageUrl, prompt);
  }

  async handleAttributeExtractionResults(
    gptData: any,
    positionCode: string,
    playerId: number,
  ): Promise<any> {
    if (!gptData || !positionCode || !playerId) {
      throw new BadRequestException('Missing GPT data or required parameters.');
    }

    if (positionCode === POSTION_CODE.WiderReceiver) {
      return this.handleWideReceiverAttributes(gptData, playerId);
    }

    return this.convertAndSaveAttributes(gptData, positionCode, playerId);
  }

  private async handleWideReceiverAttributes(data: any, playerId: number) {
    const attributes = {
      route_running: data.RouteRunning || data['Route Running'] || 0,
      hands: data.Hands || 0,
      elusiveness: data.Elusiveness || data.Eiusiveness || 0,
      power: data.Power || 0,
      quickness: data.Quickness || 0,
      awareness: data.Awareness || 0,
      ball_carrier_vision: data['Ball Carrier Vision'] || 0,
      deep_route_running: data['Deep Route Running'] || 0,
      medium_route_running: data['Medium Route Running'] || 0,
      short_route_running: data['Short Route Running'] || 0,
      catching: data.Catching || 0,
      spectacular_catch: data['Spectacular Catch'] || 0,
      catch_in_traffic: data['Catch in Traffic'] || 0,
      carrying: data.Carrying || 0,
      release: data.Release || 0,
      player: { id: playerId },
    };

    const result = this.playerAttrRepo.create(attributes);
    await this.playerAttrRepo.save(result);

    return {
      message: 'WR attributes saved successfully',
      attributes,
    };
  }

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

    if (!primaryFile) throw new BadRequestException('Missing required bio data in images');

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

  async convertAndSaveAttributes(dataobj: any, positionCode: string, playerId: number) {
    const draft_round = dataobj.draft_round || 1;
    const collegeYearKey = this.normalizeClassString(dataobj.CLASS || dataobj.YEAR || '') as any;
    const collegeYearAge = CollageAgeMapping[collegeYearKey] ?? 0;
    const calculatedAge = Math.floor(Math.random() * 2) + 17 + collegeYearAge;

    const convertedData = {
      age: calculatedAge,
      speed: (dataobj.speed || 0) + 0,
      acceleration: (dataobj.acceleration || 0) + 2,
      agility: (dataobj.agility || 0) + 1,
      change_of_direction: (dataobj.change_of_direction || 0) + 3,
      strength: (dataobj.strength || 0) - 3,
      awareness: (dataobj.awareness || 0) - 4,
      break_tackle: (dataobj.break_tackle || 0) - 2 - draft_round,
      catch_in_traffic: (dataobj.catch_in_traffic || 0) - 1 - draft_round,
      spectacular_catch: (dataobj.spectacular_catch || 0) - draft_round,
      release: (dataobj.release || 0) + 2 - draft_round,
      pass_block: (dataobj.pass_block || 0) - 14 - draft_round,
      pass_block_power: (dataobj.pass_block_power || 0) - 14 - draft_round,
      pass_block_finesse: (dataobj.pass_block_finesse || 0) - 10 - draft_round,
      run_block: (dataobj.run_block || 0) - 11 - draft_round,
      run_block_power: (dataobj.run_block_power || 0) - 12 - draft_round,
      run_block_finesse: (dataobj.run_block_finesse || 0) - 16 - draft_round,
      lead_block: (dataobj.lead_blocking || 0) - 4 - draft_round,
      impact_block: (dataobj.impact_blocking || 0) + 7 - draft_round,
      jumping: (dataobj.jumping || 0) + 3,
      carrying: (dataobj.carrying || 0) - 1 - draft_round,
      trucking: (dataobj.trucking || 0) - draft_round,
      catching: (dataobj.catching || 0) - draft_round,
      stiff_arm: (dataobj.stiff_arm || 0) - draft_round,
      spin_move: (dataobj.spin_move || 0) - 1 - draft_round,
      juke_move: (dataobj.juke_move || 0) - 1 - draft_round,
      short_route_running: (dataobj.short_route_running || 0) - 12 - draft_round,
      medium_route_running: (dataobj.medium_route_running || 0) - 13 - draft_round,
      deep_route_running: (dataobj.deep_route_running || 0) - 6 - draft_round,
      stamina: (dataobj.stamina || 0) - 1,
      injury: (dataobj.injury || 0) - 1,
      player: { id: playerId },
    };

    const result = this.playerAttrRepo.create(convertedData);
    await this.playerAttrRepo.save(result);

    return {
      message: `Conversion of ${positionCode} successful`,
      attributes: convertedData,
    };
  }
}