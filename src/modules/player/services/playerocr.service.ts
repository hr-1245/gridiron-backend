import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository, DeepPartial } from 'typeorm';

import { InjectQueue } from '@nestjs/bull';

import { Queue } from 'bull';

import { ConfigService } from '@nestjs/config';

import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';

import { PlayerAttributesEntity, PlayerEntity, PlayerImageEntity } from '../entity/players.entity';

import { PlayerPositionEntity } from '../entity/player-position.entity';

import { POSTION_CODE, CollageAgeMapping } from 'src/types/enums/roles';

import { OpenAI } from 'openai';

import { All_Middle_LinebackersDTO, CornerBackDto, DefensiveTackleDto, FullBackDto, KickerDto, Left_Outside_linebacker_above_245_lbsDTO, LeftEndDTO, LeftGaurdDto, LeftOutside_linebacker_below_245lbsDTO, LeftTackleDto, PunterDto, QuarterBackDto, Right_Outside_linebacker_above_245lbsDTO, RightEndDTO, RightGaurdDto, RightOutside_linebacker_below_245lbsDTO, RightTackleDto, RunningBackDto, SafetyDto, TightEndDto, WideReceiverDto } from '../dto/convert-manually.dto';

import { areNamesEquivalent, extractDraftRound, findBestNameMatch, normalizeClassString, parseHeightString, parseWeightString } from 'src/utils/helpers/helpers';
import { playerDraftFolderEntity } from '../entity/player-draft-folder.entity';

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

    @InjectRepository(playerDraftFolderEntity)
    private readonly playerDraftRepo: Repository<playerDraftFolderEntity>,

    @InjectQueue('imageProcessing')
    private readonly imageQueue: Queue,

    private readonly cloudinaryService: CloudinaryService,

    private readonly configService: ConfigService,
  ) {
    this.openAI = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_KEY'),
    });
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
            content: `Extract ONLY the player bio information visible in the image. 
          Return ONLY as JSON with these exact keys: NAME, POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, REASON, JERSEY_NUMBER, isPlayerBioScreen. 
          JERSEY_NUMBER should be extracted from the POSITION field if it contains a value like "#19". 
          Set isPlayerBioScreen to true ONLY if this appears to be a "PLAYERS LEAVING" or roster bio screen showing full player details, not an attributes/ratings screen. 
          An attributes/ratings screen typically shows detailed skill ratings, while a bio screen shows personal information like hometown.
          If a value is not visible, return null or an empty string. Do NOT return any explanation or additional formatting.`
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

      let attributeData: any = null;
      let bioData: any = null;
      let attributeError: any = null;
      let bioError: any = null;

      try {
        attributeData = await this.callGptOcr(imageUrl);
      } catch (error) {
        attributeError = error;
      }

      try {
        bioData = await this.extractStructuredPlayerData(file);
      } catch (error) {
        bioError = error;
      }

      if (bioData && bioData.NAME && bioData.POS &&
        (bioData.HEIGHT || bioData.WEIGHT || bioData.HOMETOWN || bioData.REASON)) {
        return {
          type: 'PLAYERS LEAVING',
          data: bioData,
          positionCode: bioData.POS
        };
      }

      if (attributeData && attributeData.playerName) {
        const hasRatingsIndicators =
          attributeData.ratings?.length > 0 ||
          (typeof attributeData.attributes === 'object' && Object.keys(attributeData.attributes).length > 0) ||
          (attributeData.speed !== undefined || attributeData.acceleration !== undefined) ||
          (attributeData.position && attributeData.overallRating);

        if (hasRatingsIndicators) {
          return {
            type: 'Ratings',
            data: attributeData,
            positionCode: attributeData.position || null
          };
        }
      }

      if (bioData && bioData.NAME && bioData.POS) {
        if (bioData.OVR && !(bioData.HEIGHT || bioData.WEIGHT || bioData.HOMETOWN)) {
          return {
            type: 'Ratings',
            data: {
              playerName: bioData.NAME,
              position: bioData.POS,
              overallRating: bioData.OVR
            },
            positionCode: bioData.POS
          };
        }

        return {
          type: 'PLAYERS LEAVING',
          data: bioData,
          positionCode: bioData.POS
        };
      }

      if (attributeData && attributeData.playerName) {
        return {
          type: 'Ratings',
          data: attributeData,
          positionCode: attributeData.position || null
        };
      }

      throw new Error('Could not reliably identify image type. Missing key information in the image.');

    } catch (error) {
      this.logger.error(`Image identification failed for ${file.originalname}:`, error);
      return {
        type: 'Ratings',
        data: null,
        error: `Image processing failed: ${error.message}`
      };
    }
  }

  private async getOrCreateDraftFolders(userId: number, folderName?: string): Promise<playerDraftFolderEntity | null> {

    if (!folderName) return null;
    let folder = await this.playerDraftRepo.findOne({
      where: {
        name: folderName,
        user: { id: userId }
      }
    });

    if (!folder) {
      folder = this.playerDraftRepo.create({
        name: folderName,
        user: { id: userId }
      });
      await this.playerDraftRepo.save(folder);
    }

    return folder;
  }

  async processBulkPlayerImages(files: Express.Multer.File[], userId: number, draftfolderName: string): Promise<any> {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    const classificationResults = await Promise.all(
      files.map(async file => {
        try {
          const result = await this.identifyImageType(file);
          return { file, ...result, originalName: file.originalname };
        } catch (error) {
          return {
            file,
            originalName: file.originalname,
            error: `Failed to classify image: ${error.message}`,
            type: 'unknown',
            data: null
          };
        }
      })
    );

    const bioImages = classificationResults.filter(r => r.type === 'PLAYERS LEAVING' && !r.error);
    const attributeImages = classificationResults.filter(r => r.type === 'Ratings' && !r.error);
    const invalidImages = classificationResults.filter(r => r.error || r.type === 'unknown');

    if (bioImages.length === 0) {
      const orphanedAttributes = attributeImages.map(img => ({
        filename: img.originalName,
        error: 'No player bio images found - attribute images must be uploaded with matching player bio images'
      }));

      throw new BadRequestException({
        message: 'No valid player bio images found in the uploaded files',
        invalidImages: [
          ...invalidImages.map(img => ({
            filename: img.originalName,
            error: img.error
          })),
          ...orphanedAttributes
        ]
      });
    }

    const bioNamesMap = new Map(
      bioImages.map(bio => [bio.data.NAME.toLowerCase(), bio])
    );

    const attributesByBioName = new Map<string, Array<{ file: Express.Multer.File, data: any, positionCode?: string, originalName: string }>>();
    bioNamesMap.forEach((_, name) => {
      attributesByBioName.set(name, []);
    });

    const unassignedAttributes: Array<{ file: Express.Multer.File, data: any, positionCode?: string, originalName: string }> = [];

    attributeImages.forEach(attrImage => {
      const attrName = attrImage.data?.playerName;

      if (attrName) {
        const matchedBioName = findBestNameMatch(attrName, Array.from(bioNamesMap.keys()));

        if (matchedBioName) {
          const attributes = attributesByBioName.get(matchedBioName) || [];
          attributes.push({ ...attrImage, originalName: attrImage.file.originalname });
          attributesByBioName.set(matchedBioName, attributes);
          return;
        }
      }

      unassignedAttributes.push({ ...attrImage, originalName: attrImage.file.originalname });
    });

    const stillUnassignedAttributes: typeof unassignedAttributes = [];

    unassignedAttributes.forEach(attrImage => {
      const attrPosition = attrImage.positionCode || attrImage.data?.position;

      if (attrPosition) {
        const matchingBios = Array.from(bioNamesMap.entries())
          .filter(([_, bio]) => {
            const bioPosition = 'positionCode' in bio ? bio.positionCode : bio.data?.POS;
            return bioPosition === attrPosition;
          });

        if (matchingBios.length === 1) {

          const [bioName] = matchingBios[0];

          const attributes = attributesByBioName.get(bioName) || [];

          attributes.push(attrImage);

          attributesByBioName.set(bioName, attributes);
        } else if (matchingBios.length > 1) {
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
          } else {
            stillUnassignedAttributes.push(attrImage);
          }
        } else {
          stillUnassignedAttributes.push(attrImage);
        }
      } else {
        stillUnassignedAttributes.push(attrImage);
      }
    });

    const orphanedAttributeDetails = stillUnassignedAttributes.map(attr => ({
      filename: attr.originalName,
      error: `Could not match to any player bio. No matching name or position found.`
    }));

    const processPromises = Array.from(bioNamesMap.entries()).map(([bioName, bioImage]) => {
      const matchedAttributes = attributesByBioName.get(bioName) || [];
      return this.processPlayerWithAttributes(bioImage, matchedAttributes, userId, draftfolderName);
    });

    const results = await Promise.allSettled(processPromises);

    const successfulPlayers = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => ({ status: 'success', ...r.value }));

    const failedPlayers = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r, index) => {
        const bioName = Array.from(bioNamesMap.keys())[index];
        const bioImage = bioNamesMap.get(bioName);
        return {
          status: 'failed',
          name: bioImage?.data.NAME || 'Unknown Player',
          error: r.reason.message
        };
      });

    const allInvalidImages = [
      ...invalidImages.map(img => ({
        filename: img.originalName,
        error: img.error
      })),
      ...orphanedAttributeDetails
    ];

    return {
      message: `Processed ${successfulPlayers.length} players with ${attributeImages.length - stillUnassignedAttributes.length} attribute images`,
      successCount: successfulPlayers.length,
      failedCount: failedPlayers.length,
      players: [...successfulPlayers, ...failedPlayers],
      invalidImages: allInvalidImages,
      orphanedAttributes: stillUnassignedAttributes.length,
      totalFiles: files.length,
      bioImagesFound: bioImages.length,
      attributeImagesFound: attributeImages.length,
      invalidImagesFound: invalidImages.length
    };
  }


  private async processPlayerWithAttributes(
    bioImage: { file: Express.Multer.File, data: any, positionCode?: string },
    matchedAttributes: Array<{ file: Express.Multer.File, data: any, positionCode?: string, originalName: string }>,
    userId: number,
    draftFolderName?: string
  ): Promise<any> {
    const { NAME, POS, OVR, CLASS, HEIGHT, WEIGHT, HOMETOWN, REASON, JERSEY_NUMBER } = bioImage.data;

    if (!NAME || !POS) {
      throw new BadRequestException(`Invalid player bio data: Missing required fields (Name: ${NAME}, Position: ${POS})`);
    }

    const primaryFile = bioImage.file;
    const validAttributeFiles: Array<{ file: Express.Multer.File, originalName: string }> = [];
    const invalidAttributeFiles: Array<{ filename: string, error: string }> = [];

    for (const attrImage of matchedAttributes) {
      const attrName = attrImage.data?.playerName;
      const attrPosition = attrImage.positionCode || attrImage.data?.position;

      if (attrName && !areNamesEquivalent(NAME, attrName)) {
        invalidAttributeFiles.push({
          filename: attrImage.originalName,
          error: `Player name mismatch: Expected ${NAME}, found ${attrName}`
        });
        continue;
      }

      if (attrPosition && attrPosition !== POS) {
        invalidAttributeFiles.push({
          filename: attrImage.originalName,
          error: `Position mismatch: Expected ${POS}, found ${attrPosition}`
        });
        continue;
      }

      validAttributeFiles.push({
        file: attrImage.file,
        originalName: attrImage.originalName
      });
    }

    const queryRunner = this.playerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uploadResult = await this.cloudinaryService.uploadFile(primaryFile);
      if (!uploadResult?.secure_url) {
        throw new Error('Primary image upload failed');
      }

      const position = await this.playerPositionRepo.findOne({ where: { code: POS } });
      if (!position) {
        throw new NotFoundException(`Position "${POS}" not found`);
      }

      const draftRound = extractDraftRound(REASON);
      const playerClass = normalizeClassString(CLASS || '');

      const jerseyNumber = JERSEY_NUMBER && typeof JERSEY_NUMBER === 'string'
        ? JERSEY_NUMBER.trim().startsWith('#') ? JERSEY_NUMBER.trim() : `#${JERSEY_NUMBER.trim()}`
        : null;

      const folder = await this.getOrCreateDraftFolders(userId, draftFolderName);

      const playerData: DeepPartial<PlayerEntity> = {
        draftFolder: folder ? { id: folder.id } : undefined,
        name: NAME,
        overallRating: parseInt(OVR, 10) || undefined,
        height: parseHeightString(HEIGHT),
        weight: parseWeightString(WEIGHT),
        homeTown: HOMETOWN || null,
        playerClass: playerClass as any,
        projectedReason: draftRound !== null ? draftRound.toString() : undefined,
        jerseyNumber: jerseyNumber as any,
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

      const bulkJobId = `bulk-${player.id}-${Date.now()}`;

      const jobPromises = validAttributeFiles.map(async ({ file, originalName }) => {
        try {
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
              originalName: originalName,
              positionCode: POS,
              bulkJobId
            },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
            }
          );

          return {
            filename: originalName,
            status: 'queued',
            jobId: job.id
          };
        } catch (error) {
          return {
            filename: originalName,
            status: 'failed',
            error: error.message
          };
        }
      });
      const queueResults = await Promise.allSettled(jobPromises);

      const queuedJobs = queueResults
        .filter((r): r is PromiseFulfilledResult<any> =>
          r.status === 'fulfilled' && r.value.status === 'queued'
        )
        .map(r => r.value);

      const failedJobs = queueResults
        .filter((r): r is PromiseFulfilledResult<any> =>
          r.status === 'fulfilled' && r.value.status === 'failed'
        )
        .map(r => r.value);

      await queryRunner.commitTransaction();

      return {
        player: {
          folder: draftFolderName,
          id: player.id,
          name: NAME,
          position: POS,
          overallRating: parseInt(OVR, 10) || null,
          class: playerClass,
          height: HEIGHT,
          weight: WEIGHT,
          homeTown: HOMETOWN,
          draftProjection: REASON,
          jersey_Number: jerseyNumber,
          imageUrl: uploadResult.secure_url,
        },
        attributes: {
          valid: queuedJobs.length,
          failed: failedJobs.length + invalidAttributeFiles.length,
          queued: queuedJobs.length,
          bulkJobId,
          invalidDetails: [...invalidAttributeFiles, ...failedJobs.map(job => ({
            filename: job.filename,
            error: job.error
          }))]
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