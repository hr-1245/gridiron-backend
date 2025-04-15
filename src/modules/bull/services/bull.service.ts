import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PlayerOcrService } from 'src/modules/player/services/playerocr.service';
import { PlayerEntity, PlayerAttributesEntity, PositionAttributeMappingEntity } from 'src/modules/player/entity/players.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTION_CODE } from 'src/types/enums/roles';

@Injectable()
@Processor('imageProcessing')
export class ProcessImageJob {
  private readonly positionPrompts = {
    [POSTION_CODE.QuarterBack]: `Extract ONLY these QB attributes from the image in exact format:
{
  "age": number,
  "speed": number,
  "acceleration": number,
  "agility": number,
  "awareness": number,
  "throw_power": number,
  "throw_accuracy_short": number,
  "throw_accuracy_mid": number,
  "throw_accuracy_deep": number,
  "throw_on_the_run": number,
  "throw_under_pressure": number,
  "play_action": number,
  "break_sack": number,
  "break_tackle": number,
  "trucking": number,
  "carrying": number,
  "ball_carrier_vision": number,
  "spin_move": number,
  "juke_move": number,
  "stamina": number,
  "injury": number
}`,

    [POSTION_CODE.RunningBack]: `Extract all visible Collage-Football(EA) RB attributes including:
      - Speed, Acceleration, Agility
      - Carrying, Ball Carrier Vision, Trucking
      - Break Tackle, Stiff Arm, Spin Move, Juke Move
      - Catching, Awareness, Strength
    Return ONLY raw JSON with exact attribute names and values.`,

    [POSTION_CODE.WiderReceiver]: `Extract ONLY these WR attributes from the image in exact format:
{
  "age": number,
  "speed": number,
  "acceleration": number,
  "agility": number,
  "change_of_direction": number,
  "strength": number,
  "awareness": number,
  "break_tackle": number,
  "catch_in_traffic": number,
  "spectacular_catch": number,
  "release": number,
  "jumping": number,
  "carrying": number,
  "trucking": number,
  "ball_carrier_vision": number,
  "catching": number,
  "stiff_arm": number,
  "spin_move": number,
  "juke_move": number,
  "short_route_running": number,
  "medium_route_running": number,
  "deep_route_running": number,
  "stamina": number,
  "return": number,
  "injury": number
}`,

    [POSTION_CODE.TightEnd]: `Extract all visible Collage-Football(EA) TE attributes including:
      - Blocking (Run Blocking, Pass Blocking)
      - Route Running (and sub-attributes)
      - Catching abilities
      - Strength, Awareness
    Return ONLY raw JSON with exact attribute names and values.`,

    [POSTION_CODE.OffensiveLine]: `Extract all visible Collage-Football(EA) OL attributes including:
      - Run Blocking, Pass Blocking
      - Strength, Awareness
      - Impact Blocking, Footwork
    Return ONLY raw JSON with exact attribute names and values.`,

    [POSTION_CODE.DefensiveEnd]: `Extract all visible Collage-Football(EA) DE attributes including:
      - Block Shedding, Power Moves, Finesse Moves
      - Tackle, Pursuit, Play Recognition
      - Strength, Speed
    Return ONLY raw JSON with exact attribute names and values.`,

    [POSTION_CODE.LineBacker]: `Extract all visible Collage-Football(EA) LB attributes including:
      - Tackle, Hit Power, Pursuit
      - Zone Coverage, Man Coverage
      - Block Shedding, Play Recognition
      - Speed, Acceleration
    Return ONLY raw JSON with exact attribute names and values.`,

    [POSTION_CODE.CornerBack]: `Extract all visible Collage-Football(EA) CB attributes including:
      - Man Coverage, Zone Coverage
      - Press, Play Recognition
      - Speed, Acceleration, Agility
      - Jumping, Catching
    Return ONLY raw JSON with exact attribute names and values.`,

    [POSTION_CODE.Safety]: `Extract all visible Collage-Football(EA) Safety attributes including:
      - Zone Coverage, Man Coverage
      - Play Recognition, Pursuit
      - Tackle, Hit Power
      - Speed, Acceleration
    Return ONLY raw JSON with exact attribute names and values.`,
  };

  constructor(
    private readonly ocrService: PlayerOcrService,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,
    @InjectRepository(PositionAttributeMappingEntity)
    private readonly mappingRepo: Repository<PositionAttributeMappingEntity>,
  ) { }

  private readonly logger = new Logger(ProcessImageJob.name);

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing image: ${job.data.originalName} for player: ${job.data.playerId}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job completed for player ${job.data.playerId}: ${JSON.stringify(result.status)}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job failed for player ${job.data.playerId}: ${err.message}`);
  }

  @Process('processImage')
  async handleImageProcessing(job: Job<{
    userId: number;
    playerId: number;
    imageUrl: string;
    originalName: string;
    positionCode: string;
  }>) {
    const { playerId, imageUrl, positionCode } = job.data;

    try {
      this.logger.log(`Starting attribute extraction for ${positionCode} player (ID: ${playerId})`);

      // ✅ Check if attributes already exist for this player & position
      const player = await this.playerRepo.findOne({
        where: { id: playerId },
        relations: ['attributes', 'position'],
      });

      if (!player) {
        throw new Error(`Player with ID ${playerId} not found`);
      }

      // Defensive check: if attributes already exist for this position
      const existingAttrs = player.attributes?.length > 0 &&
        player.attributes.filter(attr => attr?.player?.id === playerId).length > 0;

      if (existingAttrs) {
        this.logger.warn(`Duplicate detected: Player ${playerId} already has attributes. Skipping processing.`);
        return {
          status: 'skipped',
          reason: 'Attributes already exist',
          playerId,
          processedAt: new Date()
        };
      }

      // GPT call with retries
      let gptResult;
      const retryCount = 3;
      let attempts = 0;

      while (attempts < retryCount) {
        try {
          gptResult = await this.ocrService.callGptOcr(
            imageUrl,
            this.positionPrompts[positionCode] ||
            'Extract all visible football player attributes. Return ONLY raw JSON with exact attribute names and numeric values.'
          );
          break;
        } catch (error) {
          attempts++;
          if (attempts >= retryCount) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      // Save extracted attributes (ensure handleAttributeExtractionResults is also deduplicating if called directly)
      const result = await this.ocrService.handleAttributeExtractionResults(
        gptResult,
        positionCode,
        playerId
      );

      return {
        status: 'success',
        playerId,
        positionCode,
        attributesCount: Object.keys(result.result).length,
        processedAt: new Date()
      };
    } catch (err) {
      this.logger.error(`Processing failed for player ${playerId}: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Failed to process player attributes: ${err.message}`);
    }
  }
}
