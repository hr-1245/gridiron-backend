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
import { All_Middle_LinebackersDTO, CornerBackDto, DefensiveTackleDto, FullBackDto, KickerDto, Left_Outside_linebacker_above_245_lbsDTO, LeftEndDTO, LeftGaurdDto, LeftOutside_linebacker_below_245lbsDTO, LeftTackleDto, PunterDto, QuarterBackDto, Right_Outside_linebacker_above_245lbsDTO, RightEndDTO, RightGaurdDto, RightOutside_linebacker_below_245lbsDTO, RightTackleDto, RunningBackDto, SafetyDto, TightEndDto, WideReceiverDto } from '../dto/convert-manually.dto';
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

  private parseHeightString(heightStr: string): string | null {
    if (!heightStr) return null;
    const formattedMatch = heightStr.match(/^(\d+)'(\d+)?"?$/);
    if (formattedMatch) {
      const feet = formattedMatch[1];
      const inches = formattedMatch[2] || '0';
      return `${feet}'${inches}`;
    }
    const inches = parseInt(heightStr, 10);
    if (!isNaN(inches)) {
      return heightStr;
    }
    return null;
  }

  private formatHeightFromInches(totalInches: number): string {
    if (totalInches === undefined || totalInches === null || totalInches < 0) return '';
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
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

  private findBestNameMatch(attrName: string, bioNames: string[]): string | null {
    if (!attrName) return null;

    const normalizedAttrName = attrName.toLowerCase();

    // First, try exact match
    const exactMatch = bioNames.find(name => name === normalizedAttrName);
    if (exactMatch) return exactMatch;

    // Next, try if one name contains the other
    for (const bioName of bioNames) {
      if (bioName.includes(normalizedAttrName) || normalizedAttrName.includes(bioName)) {
        return bioName;
      }
    }

    // Try more flexible matching - last name match
    const attrNameParts = normalizedAttrName.split(' ');
    const attrLastName = attrNameParts[attrNameParts.length - 1];

    for (const bioName of bioNames) {
      const bioNameParts = bioName.split(' ');
      const bioLastName = bioNameParts[bioNameParts.length - 1];

      if (bioLastName === attrLastName) {
        return bioName;
      }
    }

    // If still no matches, try partial last name match
    for (const bioName of bioNames) {
      const bioNameParts = bioName.split(' ');
      const bioLastName = bioNameParts[bioNameParts.length - 1];

      if (bioLastName.includes(attrLastName) || attrLastName.includes(bioLastName)) {
        return bioName;
      }
    }

    return null;
  }


  async callGptOcr(imageUrl: string, prompt?: string): Promise<any> {
    try {
      const strictPrompt = prompt ?
        `${prompt} ONLY return the requested JSON format with NUMERIC values. No explanations or extra text.` :
        `Extract ONLY the player attributes visible in the image AND the player name if visible. Return ONLY a clean JSON object with attribute names exactly as they appear and numeric values. Include a "playerName" field if a name is visible in the image.`;

      const messages: any = [
        {
          role: 'system',
          content: 'You are a precision Collage football (EA) game attribute extractor. Return only valid JSON with numeric values for attributes and player identification information when available. No explanations or text outside the JSON.'
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

      const content = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('GPT Attribute OCR error:', error);
      throw new InternalServerErrorException('Failed to extract attributes from image.');
    }
  }

  async convertAttributes(
    rawData: any,
    positionCode: string,
    player: PlayerEntity
  ): Promise<Partial<PlayerAttributesEntity>> {

    const draft_round = player.projectedReason ? parseInt(player.projectedReason, 10) || 1 : 1;
    const collegeYearKey = player.playerClass;
    const collegeYearAge = CollageAgeMapping[collegeYearKey] ?? 0;
    const calculatedAge = Math.floor(Math.random() * 2) + 17 + collegeYearAge;

    let adjustedData: Partial<PlayerAttributesEntity> = { age: calculatedAge };

    const getAdjustedValue = <T extends object>(
      data: T,
      key: keyof T,
      adjustment: number
    ): number | undefined => {
      const value = data[key];
      if (value !== undefined && value !== null) {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
          return Math.min(100, Math.max(0, numericValue + adjustment));
        }
      }
      return undefined;
    };

    switch (positionCode) {
      case POSTION_CODE.WiderReceiver: {
        const data = rawData as WideReceiverDto;

        adjustedData = {
          ...adjustedData,
          speed: getAdjustedValue(data, 'speed', -2) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', 0) ?? undefined,
          agility: getAdjustedValue(data, 'agility', 0) ?? undefined,
          change_of_direction: getAdjustedValue(data, 'change_of_direction', -1) ?? undefined,
          strength: getAdjustedValue(data, 'strength', - 7) ?? undefined,
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

      case POSTION_CODE.All_Middle_Linebackers: {
        const data = rawData as All_Middle_LinebackersDTO

        adjustedData = {
          ...adjustedData,
          speed: getAdjustedValue(data, 'speed', -4) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -2) ?? undefined,
          change_of_direction: getAdjustedValue(data, 'change_of_direction', -4) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', - 9 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -7) ?? undefined,
          jumping: getAdjustedValue(data, 'jumping', -12) ?? undefined,
          tackling: getAdjustedValue(data, 'tackling', - 7 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -3) ?? undefined,
          power_moves: getAdjustedValue(data, 'power_moves', - 21 - draft_round) ?? undefined,
          finesse_moves: getAdjustedValue(data, 'finesse_moves', - 25 - draft_round) ?? undefined,
          block_shedding: getAdjustedValue(data, 'block_shedding', - 6 - draft_round) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', - 6 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', - 18 - draft_round) ?? undefined,
          man_coverage: getAdjustedValue(data, 'man_coverage', - 25 - draft_round) ?? undefined,
          zone_coverage: getAdjustedValue(data, 'zone_coverage', - 22 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,

        }
        break
      }

      case POSTION_CODE.QuarterBack: {
        const data = rawData as QuarterBackDto

        adjustedData = {
          ...adjustedData,
          speed: getAdjustedValue(data, 'speed', -2) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -5) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', - 10 - draft_round) ?? undefined,
          throw_power: getAdjustedValue(data, 'throw_power', -1) ?? undefined,
          throw_accuracy_short: getAdjustedValue(data, 'throw_accuracy_short', - 7 - draft_round) ?? undefined,
          throw_accuracy_deep: getAdjustedValue(data, 'throw_accuracy_deep', - 14 - draft_round) ?? undefined,
          throw_on_the_run: getAdjustedValue(data, 'throw_on_the_run', - 8 - draft_round) ?? undefined,
          throw_under_pressure: getAdjustedValue(data, 'throw_under_pressure', - 11 - draft_round) ?? undefined,
          play_action: getAdjustedValue(data, 'play_action', - 15 - draft_round) ?? undefined,
          break_sack: getAdjustedValue(data, 'break_sack', - 9 - draft_round) ?? undefined,
          break_tackle: getAdjustedValue(data, 'break_tackle', - 4 - draft_round) ?? undefined,
          trucking: getAdjustedValue(data, 'trucking', - 13 - draft_round) ?? undefined,
          carrying: getAdjustedValue(data, 'carrying', - 26 - draft_round) ?? undefined,
          ball_carrier_vision: getAdjustedValue(data, 'ball_carrier_vision', - 13 - draft_round) ?? undefined,
          stiff_arm: getAdjustedValue(data, 'stiff_arm', - 7 - draft_round) ?? undefined,
          spin_move: getAdjustedValue(data, 'spin_move', - 14 - draft_round) ?? undefined,
          juke_move: getAdjustedValue(data, 'juke_move', - 10 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -2) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,

        }
        break
      }
      case POSTION_CODE.RunningBack: {
        const data = rawData as RunningBackDto

        adjustedData = {
          ...adjustedData,
          speed: getAdjustedValue(data, 'speed', -2) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', 0) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -4) ?? undefined,
          change_of_direction: getAdjustedValue(data, 'change_of_direction', -4) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -3) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -11 - draft_round) ?? undefined,
          break_tackle: getAdjustedValue(data, 'break_tackle', -7 - draft_round) ?? undefined,
          carrying: getAdjustedValue(data, 'carrying', -5 - draft_round) ?? undefined,
          trucking: getAdjustedValue(data, 'trucking', -7 - draft_round) ?? undefined,
          ball_carrier_vision: getAdjustedValue(data, 'ball_carrier_vision', -14 - draft_round) ?? undefined,
          catching: getAdjustedValue(data, 'catching', -14 - draft_round) ?? undefined,
          stiff_arm: getAdjustedValue(data, 'stiff_arm', -3 - draft_round) ?? undefined,
          spin_move: getAdjustedValue(data, 'spin_move', -8 - draft_round) ?? undefined,
          juke_move: getAdjustedValue(data, 'juke_move', -8 - draft_round) ?? undefined,
          pass_block: getAdjustedValue(data, 'pass_block', -24 - draft_round) ?? undefined,
          catch_in_traffic: getAdjustedValue(data, 'catch_in_traffic', -19 - draft_round) ?? undefined,
          spectacular_catch: getAdjustedValue(data, 'spectacular_catch', -12 - draft_round) ?? undefined,
          short_route_running: getAdjustedValue(data, 'short_route_running', -16 - draft_round) ?? undefined,
          medium_route_running: getAdjustedValue(data, 'short_route_running', -16 - draft_round) ?? undefined,
          release: getAdjustedValue(data, 'release', -7 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -2) ?? undefined,
          return: getAdjustedValue(data, 'return', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.TightEnd: {
        const data = rawData as TightEndDto

        adjustedData = {
          ...adjustedData,
          speed: getAdjustedValue(data, 'speed', 0) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', 2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', 1) ?? undefined,
          change_of_direction: getAdjustedValue(data, 'change_of_direction', 3) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -3) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -4) ?? undefined,
          break_tackle: getAdjustedValue(data, 'break_tackle', -2 - draft_round) ?? undefined,
          catch_in_traffic: getAdjustedValue(data, 'catch_in_traffic', -1 - draft_round) ?? undefined,
          spectacular_catch: getAdjustedValue(data, 'spectacular_catch', 0 - draft_round) ?? undefined,
          release: getAdjustedValue(data, 'release', 2 - draft_round) ?? undefined,
          pass_block: getAdjustedValue(data, 'pass_block', -14 - draft_round) ?? undefined,
          pass_block_power: getAdjustedValue(data, 'pass_block_power', -14 - draft_round) ?? undefined,
          pass_block_finesse: getAdjustedValue(data, 'pass_block_finesse', -10 - draft_round) ?? undefined,
          run_block: getAdjustedValue(data, 'run_block', -11 - draft_round) ?? undefined,
          run_block_power: getAdjustedValue(data, 'run_block_power', -12 - draft_round) ?? undefined,
          run_block_finesse: getAdjustedValue(data, 'run_block_finesse', -16 - draft_round) ?? undefined,
          lead_block: getAdjustedValue(data, 'lead_blocking', -4 - draft_round) ?? undefined,
          impact_block: getAdjustedValue(data, 'impact_blocking', 7 - draft_round) ?? undefined,
          jumping: getAdjustedValue(data, 'jumping', 3) ?? undefined,
          carrying: getAdjustedValue(data, 'carrying', -1 - draft_round) ?? undefined,
          trucking: getAdjustedValue(data, 'trucking', 0 - draft_round) ?? undefined,
          catching: getAdjustedValue(data, 'catching', 0 - draft_round) ?? undefined,
          stiff_arm: getAdjustedValue(data, 'stiff_arm', 0 - draft_round) ?? undefined,
          spin_move: getAdjustedValue(data, 'spin_move', -1 - draft_round) ?? undefined,
          juke_move: getAdjustedValue(data, 'juke_move', -1 - draft_round) ?? undefined,
          short_route_running: getAdjustedValue(data, 'short_route_running', -12 - draft_round) ?? undefined,
          medium_route_running: getAdjustedValue(data, 'medium_route_running', -13 - draft_round) ?? undefined,
          deep_route_running: getAdjustedValue(data, 'deep_route_running', -6 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }

      case POSTION_CODE.LeftTackle: {
        const data = rawData as LeftTackleDto

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -6) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -5) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -8 - draft_round) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -13) ?? undefined,
          strength: getAdjustedValue(data, 'strength', 1) ?? undefined,
          lead_block: getAdjustedValue(data, 'lead_block', -9 - draft_round) ?? undefined,
          impact_block: getAdjustedValue(data, 'lead_block', -6 - draft_round) ?? undefined, // note: based on same 'lead_block' field as original
          run_block: getAdjustedValue(data, 'run_block', -15 - draft_round) ?? undefined,
          pass_block: getAdjustedValue(data, 'pass_block', -13 - draft_round) ?? undefined,
          pass_block_finesse: getAdjustedValue(data, 'pass_block_finesse', -14 - draft_round) ?? undefined,
          run_block_power: getAdjustedValue(data, 'run_block_power', -18 - draft_round) ?? undefined,
          run_block_finesse: getAdjustedValue(data, 'run_block_finesse', -14 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.RightTackle: {
        const data = rawData as RightTackleDto

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -6) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -5) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -8 - draft_round) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -13) ?? undefined,
          strength: getAdjustedValue(data, 'strength', 1) ?? undefined,
          lead_block: getAdjustedValue(data, 'lead_block', -9 - draft_round) ?? undefined,
          impact_block: getAdjustedValue(data, 'lead_block', -6 - draft_round) ?? undefined, // double-check if 'impact_block' should be separate
          run_block: getAdjustedValue(data, 'run_block', -15 - draft_round) ?? undefined,
          pass_block: getAdjustedValue(data, 'pass_block', -13 - draft_round) ?? undefined,
          pass_block_finesse: getAdjustedValue(data, 'pass_block_finesse', -14 - draft_round) ?? undefined,
          run_block_power: getAdjustedValue(data, 'run_block_power', -18 - draft_round) ?? undefined,
          run_block_finesse: getAdjustedValue(data, 'run_block_finesse', -14 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }

      case POSTION_CODE.LeftGuard: {
        const data = rawData as LeftGaurdDto

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', 0) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -3) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -9 - draft_round) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -12) ?? undefined,
          lead_block: getAdjustedValue(data, 'lead_block', -8 - draft_round) ?? undefined,
          impact_block: getAdjustedValue(data, 'impact_blocking', -3 - draft_round) ?? undefined,
          run_block: getAdjustedValue(data, 'run_blocking', -16 - draft_round) ?? undefined,
          pass_block: getAdjustedValue(data, 'pass_blocking', -12 - draft_round) ?? undefined,
          pass_block_power: getAdjustedValue(data, 'pass_block_power', -15 - draft_round) ?? undefined,
          pass_block_finesse: getAdjustedValue(data, 'pass_block_finesse', -16 - draft_round) ?? undefined,
          run_block_power: getAdjustedValue(data, 'run_block_power', -16 - draft_round) ?? undefined,
          run_block_finesse: getAdjustedValue(data, 'run_block_finesse', -16 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.RightGuard: {
        const data = rawData as RightGaurdDto

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', 0) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -3) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -9 - draft_round) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -12) ?? undefined,
          lead_block: getAdjustedValue(data, 'lead_block', -8 - draft_round) ?? undefined,
          impact_block: getAdjustedValue(data, 'impact_blocking', -3 - draft_round) ?? undefined,
          run_block: getAdjustedValue(data, 'run_blocking', -16 - draft_round) ?? undefined,
          pass_block: getAdjustedValue(data, 'pass_blocking', -12 - draft_round) ?? undefined,
          pass_block_power: getAdjustedValue(data, 'pass_block_power', -15 - draft_round) ?? undefined,
          pass_block_finesse: getAdjustedValue(data, 'pass_block_finesse', -16 - draft_round) ?? undefined,
          run_block_power: getAdjustedValue(data, 'run_block_power', -16 - draft_round) ?? undefined,
          run_block_finesse: getAdjustedValue(data, 'run_block_finesse', -16 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.LeftEnd: {
        const data = rawData as LeftEndDTO

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -4) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -14) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -15 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -2) ?? undefined,
          tackling: getAdjustedValue(data, 'tackling', -13 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -6) ?? undefined,
          power_moves: getAdjustedValue(data, 'power_moves', -13 - draft_round) ?? undefined,
          finesse_moves: getAdjustedValue(data, 'finesse_moves', -8 - draft_round) ?? undefined,
          block_shedding: getAdjustedValue(data, 'block_shed', -16 - draft_round) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -16 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -24 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.RightEnd: {
        const data = rawData as RightEndDTO

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -4) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -14) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -15 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -2) ?? undefined,
          tackling: getAdjustedValue(data, 'tackling', -13 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -6) ?? undefined,
          power_moves: getAdjustedValue(data, 'power_moves', -13 - draft_round) ?? undefined,
          finesse_moves: getAdjustedValue(data, 'finesse_moves', -8 - draft_round) ?? undefined,
          block_shedding: getAdjustedValue(data, 'block_shed', -16 - draft_round) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -16 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -24 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.LeftOutside_linebacker_above_245_lbs: {
        const data = rawData as Left_Outside_linebacker_above_245_lbsDTO

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -4) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -14) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -15 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -2) ?? undefined,
          tackling: getAdjustedValue(data, 'tackling', -13 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -6) ?? undefined,
          power_moves: getAdjustedValue(data, 'power_moves', -13 - draft_round) ?? undefined,
          finesse_moves: getAdjustedValue(data, 'finesse_moves', -8 - draft_round) ?? undefined,
          block_shedding: getAdjustedValue(data, 'block_shed', -16 - draft_round) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -16 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -24 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.RightOutside_linebacker_above_245lbs: {
        const data = rawData as Right_Outside_linebacker_above_245lbsDTO

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -4) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -14) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -15 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -2) ?? undefined,
          tackling: getAdjustedValue(data, 'tackling', -13 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -6) ?? undefined,
          power_moves: getAdjustedValue(data, 'power_moves', -13 - draft_round) ?? undefined,
          finesse_moves: getAdjustedValue(data, 'finesse_moves', -8 - draft_round) ?? undefined,
          block_shedding: getAdjustedValue(data, 'block_shed', -16 - draft_round) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -16 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -24 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.DefensiveTackle: {
        const data = rawData as DefensiveTackleDto

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -1) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', 0) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -5) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -13 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', 0) ?? undefined,
          tackling: getAdjustedValue(data, 'tackling', -11 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -11) ?? undefined,
          power_moves: getAdjustedValue(data, 'power_moves', -8 - draft_round) ?? undefined,
          finesse_moves: getAdjustedValue(data, 'finesse_moves', -9 - draft_round) ?? undefined,
          block_shedding: getAdjustedValue(data, 'block_shedding', -10 - draft_round) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -15 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -18 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -3) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -2) ?? undefined,
        }

        break
      }
      case POSTION_CODE.LeftOutside_linebacker_below_245lbs: {
        const data = rawData as LeftOutside_linebacker_below_245lbsDTO

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -4) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -2) ?? undefined,
          change_of_direction: 'change_of_direction' in data ? getAdjustedValue(data, 'change_of_direction', -4) : undefined,
          awareness: getAdjustedValue(data, 'awareness', -9 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -7) ?? undefined,
          jumping: 'jumping' in data ? getAdjustedValue(data, 'jumping', -12) : undefined,
          tackling: getAdjustedValue(data, 'tackling', -7 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -3) ?? undefined,
          power_moves: getAdjustedValue(data, 'power_moves', -21 - draft_round) ?? undefined,
          finesse_moves: getAdjustedValue(data, 'finesse_moves', -25 - draft_round) ?? undefined,
          block_shedding: getAdjustedValue(data, 'block_shedding', -6 - draft_round) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -6 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -18 - draft_round) ?? undefined,
          man_coverage: 'man_coverage' in data ? getAdjustedValue(data, 'man_coverage', -25 - draft_round) : undefined,
          zone_coverage: 'zone_coverage' in data ? getAdjustedValue(data, 'zone_coverage', -22 - draft_round) : undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break
      }
      case POSTION_CODE.RightOutside_linebacker_below_245lbs: {
        const data = rawData as RightOutside_linebacker_below_245lbsDTO;

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -4) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -2) ?? undefined,
          agility: getAdjustedValue(data, 'agility', -2) ?? undefined,
          change_of_direction: 'change_of_direction' in data ? getAdjustedValue(data, 'change_of_direction', -4) : undefined,
          awareness: getAdjustedValue(data, 'awareness', -9 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -7) ?? undefined,
          jumping: 'jumping' in data ? getAdjustedValue(data, 'jumping', -12) : undefined,
          tackling: getAdjustedValue(data, 'tackling', -7 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -3) ?? undefined,
          power_moves: getAdjustedValue(data, 'power_moves', -21 - draft_round) ?? undefined,
          finesse_moves: getAdjustedValue(data, 'finesse_moves', -25 - draft_round) ?? undefined,
          block_shedding: getAdjustedValue(data, 'block_shedding', -6 - draft_round) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -6 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -18 - draft_round) ?? undefined,
          man_coverage: 'man_coverage' in data ? getAdjustedValue(data, 'man_coverage', -25 - draft_round) : undefined,
          zone_coverage: 'zone_coverage' in data ? getAdjustedValue(data, 'zone_coverage', -22 - draft_round) : undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break;
      }
      case POSTION_CODE.CornerBack: {
        const data = rawData as CornerBackDto;

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -4) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', 0) ?? undefined,
          agility: getAdjustedValue(data, 'agility', 0) ?? undefined,
          change_of_direction: getAdjustedValue(data, 'change_of_direction', -2) ?? undefined,
          catching: 'catching' in data ? getAdjustedValue(data, 'catching', -19 - draft_round) : undefined,
          awareness: getAdjustedValue(data, 'awareness', -7 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -8) ?? undefined,
          jumping: getAdjustedValue(data, 'jumping', -1) ?? undefined,
          tackling: 'tackling' in data ? getAdjustedValue(data, 'tackling', -8 - draft_round) : undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -10) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -13 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -15 - draft_round) ?? undefined,
          man_coverage: getAdjustedValue(data, 'man_coverage', -13 - draft_round) ?? undefined,
          zone_coverage: getAdjustedValue(data, 'zone_coverage', -13 - draft_round) ?? undefined,
          press: getAdjustedValue(data, 'press', -10 - draft_round) ?? undefined,
          return: getAdjustedValue(data, 'return', 0) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        }

        break;
      }
      case POSTION_CODE.Safety: {
        const data = rawData as SafetyDto;

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', -1) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -1) ?? undefined,
          agility: getAdjustedValue(data, 'agility', 1) ?? undefined,
          change_of_direction: getAdjustedValue(data, 'change_of_direction', -9) ?? undefined,
          catching: getAdjustedValue(data, 'catching', -22 - draft_round) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -8 - draft_round) ?? undefined,
          strength: getAdjustedValue(data, 'strength', -11) ?? undefined,
          block_shedding: 'block_shed' in data ? getAdjustedValue(data, 'block_shed', -8 - draft_round) : undefined,
          jumping: getAdjustedValue(data, 'jumping', -6) ?? undefined,
          tackling: getAdjustedValue(data, 'tackling', -7 - draft_round) ?? undefined,
          hit_power: getAdjustedValue(data, 'hit_power', -8) ?? undefined,
          pursuit: getAdjustedValue(data, 'pursuit', -11 - draft_round) ?? undefined,
          play_recognition: getAdjustedValue(data, 'play_recognition', -18 - draft_round) ?? undefined,
          man_coverage: getAdjustedValue(data, 'man_coverage', -6 - draft_round) ?? undefined,
          zone_coverage: getAdjustedValue(data, 'zone_coverage', -15 - draft_round) ?? undefined,
          press: getAdjustedValue(data, 'press', -6 - draft_round) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          injury: getAdjustedValue(data, 'injury', -1) ?? undefined,
        };

        break;
      }
      case POSTION_CODE.Kicker: {
        const data = rawData as KickerDto

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          kick_power: getAdjustedValue(data, 'kick_power', 0) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -19) ?? undefined,
          kick_accuracy: getAdjustedValue(data, 'kick_accuracy', -3) ?? undefined,
          speed: getAdjustedValue(data, 'speed', -8) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', 7) ?? undefined,

        }
        break;
      }
      case POSTION_CODE.Punter: {
        const data = rawData as PunterDto

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          kick_power: getAdjustedValue(data, 'kick_power', 0) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', -21) ?? undefined,
          kick_accuracy: getAdjustedValue(data, 'kick_accuracy', -3) ?? undefined,
          speed: getAdjustedValue(data, 'speed', -7) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', -7) ?? undefined,

        }
        break;
      }
      case POSTION_CODE.FullBack: {
        const data = rawData as FullBackDto

        adjustedData = {
          ...adjustedData,
          age: calculatedAge,
          speed: getAdjustedValue(data, 'speed', 5) ?? undefined,
          acceleration: getAdjustedValue(data, 'acceleration', 4) ?? undefined,
          agility: getAdjustedValue(data, 'agility', 3) ?? undefined,
          stamina: getAdjustedValue(data, 'stamina', -1) ?? undefined,
          change_of_direction: getAdjustedValue(data, 'change_of_direction', 1) ?? undefined,
          lead_block: getAdjustedValue(data, 'lead_block', - 8) ?? undefined,
          run_block: getAdjustedValue(data, 'run_block', - 12) ?? undefined,
          pass_block: getAdjustedValue(data, 'pass_block', -  15) ?? undefined,
          pass_block_power: getAdjustedValue(data, 'pass_block_power', - 6) ?? undefined,
          run_block_power: getAdjustedValue(data, 'run_block_power', - 1) ?? undefined,
          pass_block_finesse: getAdjustedValue(data, 'pass_block_finesse', - 8) ?? undefined,
          run_block_finesse: getAdjustedValue(data, 'run_block_finesse', - 4) ?? undefined,
          carrying: getAdjustedValue(data, 'carrying', - 7) ?? undefined,
          catching: getAdjustedValue(data, 'catching', - 1) ?? undefined,
          catch_in_traffic: getAdjustedValue(data, 'catch_in_traffic', 19) ?? undefined,
          short_route_running: getAdjustedValue(data, 'short_route_running', - 10) ?? undefined,
          medium_route_running: getAdjustedValue(data, 'medium_route_running', - 10) ?? undefined,
          injury: getAdjustedValue(data, 'injury', - 1) ?? undefined,
          strength: getAdjustedValue(data, 'strength', 4) ?? undefined,
          impact_block: getAdjustedValue(data, 'impact_blocking', - 4) ?? undefined,
          stiff_arm: getAdjustedValue(data, 'stiff_arm', 8) ?? undefined,
          trucking: getAdjustedValue(data, 'trucking', - 1) ?? undefined,
          awareness: getAdjustedValue(data, 'awareness', - 3) ?? undefined,

        }
        break;
      }
    }

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
            content: 'Extract ONLY the player bio information visible in the image. Return ONLY as JSON with these exact keys: NAME (Only Extract Full Name), POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, REASON. If information is not visible in the image, set those fields to null or empty string.'
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

      const content = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('GPT-4o extraction error:', error);
      throw new InternalServerErrorException('Failed to extract structured data.');
    }
  }

  private async identifyImageType(file: Express.Multer.File): Promise<{
    type: 'PLAYERS LEAVING' | 'Ratings';
    data: any;
    positionCode?: string;
    error?: string;
  }> {
    try {
      const base64Image = file.buffer.toString('base64');
      const imageUrl = `data:image/png;base64,${base64Image}`;

      // First try to extract as bio image
      try {
        const bioData = await this.extractStructuredPlayerData(file);
        if (bioData.NAME && bioData.POS) {
          return {
            type: 'PLAYERS LEAVING',
            data: bioData,
            positionCode: bioData.POS
          };
        }
      } catch (bioError) {
        this.logger.debug('Image is not a bio image', bioError);
      }

      // Fall back to attribute extraction
      const attributeData = await this.callGptOcr(imageUrl);

      return {
        type: 'Ratings',
        data: attributeData,
        positionCode: attributeData.position || null
      };
    } catch (error) {
      this.logger.error(`Image identification failed for ${file.originalname}`, error);
      return {
        type: 'Ratings',
        data: null,
        error: `Image processing failed: ${error.message}`
      };
    }
  }

  async processBulkPlayerImages(files: Express.Multer.File[], userId: number): Promise<any> {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    // Step 1: Classify all images
    const classificationResults = await Promise.all(
      files.map(async file => {
        try {
          const result = await this.identifyImageType(file);
          return { file, ...result };
        } catch (error) {
          return {
            file,
            error: `Failed to classify image: ${error.message}`,
            type: 'unknown',
            data: null
          };
        }
      })
    );

    // Step 2: Group bio and attribute images
    const bioImages = classificationResults.filter(r => r.type === 'PLAYERS LEAVING' && !r.error);
    const attributeImages = classificationResults.filter(r => r.type === 'Ratings' && !r.error);
    const invalidImages = classificationResults.filter(r => r.error || r.type === 'unknown');

    if (bioImages.length === 0) {
      throw new BadRequestException('No valid player bio images found');
    }

    // Step 3: Create a map of bio names to use for attribute matching
    const bioNamesMap = new Map(
      bioImages.map(bio => [bio.data.NAME.toLowerCase(), bio])
    );

    // Step 4: Try to match attributes to players
    // Instead of flagging mismatches, we'll just use best-effort matching
    const attributesByBioName = new Map<string, Array<{ file: Express.Multer.File, data: any, positionCode?: string }>>();

    // Initialize the map with empty arrays for each bio name
    bioNamesMap.forEach((_, name) => {
      attributesByBioName.set(name, []);
    });

    // Group attribute images that we can positively match to a bio
    const unassignedAttributes: Array<{ file: Express.Multer.File, data: any, positionCode?: string }> = [];

    attributeImages.forEach(attrImage => {
      const attrName = attrImage.data?.playerName;

      // If we have a name in the attribute, try to match it
      if (attrName) {
        const matchedBioName = this.findBestNameMatch(attrName, Array.from(bioNamesMap.keys()));

        if (matchedBioName) {
          const attributes = attributesByBioName.get(matchedBioName) || [];
          attributes.push(attrImage);
          attributesByBioName.set(matchedBioName, attributes);
          return;
        }
      }

      // If no match by name, we'll collect it for position-based matching later
      unassignedAttributes.push(attrImage);
    });

    // Try to match remaining attributes by position
    unassignedAttributes.forEach(attrImage => {
      const attrPosition = attrImage.positionCode;

      if (attrPosition) {
        // Find bios with matching position
        const matchingBios = Array.from(bioNamesMap.entries())
          .filter(([_, bio]) => 'positionCode' in bio && bio.positionCode === attrPosition);

        if (matchingBios.length === 1) {
          // If exactly one bio matches the position, assign to it
          const [bioName] = matchingBios[0];
          const attributes = attributesByBioName.get(bioName) || [];
          attributes.push(attrImage);
          attributesByBioName.set(bioName, attributes);
        } else {
          // Multiple matches or no matches - use the bio with fewest attributes
          let leastAttributesBioName = '';
          let leastAttributesCount = Infinity;

          for (const [bioName, _] of matchingBios) {
            const attributesCount = (attributesByBioName.get(bioName) || []).length;
            if (attributesCount < leastAttributesCount) {
              leastAttributesCount = attributesCount;
              leastAttributesBioName = bioName;
            }
          }

          if (leastAttributesBioName) {
            const attributes = attributesByBioName.get(leastAttributesBioName) || [];
            attributes.push(attrImage);
            attributesByBioName.set(leastAttributesBioName, attributes);
          }
        }
      }
    });

    // Step 5: Process each player with their matched attributes
    const processPromises = Array.from(bioNamesMap.entries()).map(([bioName, bioImage]) => {
      const matchedAttributes = attributesByBioName.get(bioName) || [];
      return this.processPlayerWithAttributes(bioImage, matchedAttributes, userId);
    });

    const results = await Promise.allSettled(processPromises);

    // Step 6: Compile results
    const successfulPlayers = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => ({ status: 'success', ...r.value }));

    const failedPlayers = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => ({ status: 'failed', error: r.reason.message }));

    return {
      message: `Processed ${bioImages.length} players with ${attributeImages.length} attribute images`,
      successCount: successfulPlayers.length,
      failedCount: failedPlayers.length,
      players: [...successfulPlayers, ...failedPlayers],
      invalidImages: invalidImages.map(img => ({
        filename: img.file.originalname,
        error: img.error
      }))
    };
  }

  private async processPlayerWithAttributes(
    bioImage: { file: Express.Multer.File, data: any, positionCode?: string },
    matchedAttributes: Array<{ file: Express.Multer.File, data: any, positionCode?: string }>,
    userId: number
  ): Promise<any> {
    const primaryPlayerName = bioImage.data.NAME;
    const primaryPlayerPosition = bioImage.positionCode;
    const primaryFile = bioImage.file;

    const queryRunner = this.playerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Upload primary image
      const uploadResult = await this.cloudinaryService.uploadFile(primaryFile);
      if (!uploadResult?.secure_url) {
        throw new Error('Primary image upload failed');
      }

      const { NAME, POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, REASON } = bioImage.data;
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

      // Generate a unique batch ID for this player's attribute processing
      const bulkJobId = `bulk-${player.id}-${Date.now()}`;

      // Process matching attribute images - no need to report mismatches now
      const attributeFiles = matchedAttributes.map(attr => attr.file);
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
            bulkJobId
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
      const completedJobs = queueResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      await queryRunner.commitTransaction();

      return {
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
          valid: completedJobs.length,
          queued: completedJobs.length,
          bulkJobId
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Player creation failed for ${bioImage.data.NAME}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

}