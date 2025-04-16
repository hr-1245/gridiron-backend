
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
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';

@Injectable()
@Processor('imageProcessing')
export class ProcessImageJob {
  private readonly positionPrompts = {
    [POSTION_CODE.QuarterBack]: `Extract ONLY these numeric QB attributes in exact format:
{
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
  "stiff_arm": number,
  "spin_move": number,
  "juke_move": number,
  "stamina": number,
  "injury": number
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.RunningBack]: `Extract ONLY these numeric RB attributes in exact format:
{
  "speed": number,
  "acceleration": number,
  "agility": number,
  "strength": number,
  "awareness": number,
  "carrying": number,
  "ball_carrier_vision": number,
  "trucking": number,
  "break_tackle": number,
  "stiff_arm": number,
  "spin_move": number,
  "juke_move": number,
  "catching": number,
  "stamina": number,
  "injury": number
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.WiderReceiver]: `Extract ONLY these numeric WR attributes in exact format:
{
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
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.TightEnd]: `Extract ONLY these numeric TE attributes in exact format:
{
  "speed": number,
  "acceleration": number,
  "agility": number,
  "strength": number,
  "awareness": number,
  "catching": number,
  "catch_in_traffic": number,
  "spectacular_catch": number,
  "release": number,
  "short_route_running": number,
  "medium_route_running": number,
  "deep_route_running": number,
  "run_blocking": number,
  "pass_blocking": number,
  "impact_blocking": number,
  "break_tackle": number,
  "trucking": number,
  "stiff_arm": number,
  "carrying": number,
  "jumping": number,
  "stamina": number,
  "injury": number
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.OffensiveLine]: `Extract ONLY these numeric OL attributes in exact format:
{
  "strength": number,
  "awareness": number,
  "run_blocking": number,
  "pass_blocking": number,
  "impact_blocking": number,
  "lead_blocking": number,
  "footwork": number,
  "stamina": number,
  "injury": number
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.DefensiveEnd]: `Extract ONLY these numeric DE attributes in exact format:
{
  "speed": number,
  "acceleration": number,
  "strength": number,
  "awareness": number,
  "tackle": number,
  "block_shedding": number,
  "power_moves": number,
  "finesse_moves": number,
  "pursuit": number,
  "play_recognition": number,
  "hit_power": number,
  "stamina": number,
  "injury": number
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.LineBacker]: `Extract ONLY these numeric LB attributes in exact format:
{
  "speed": number,
  "acceleration": number,
  "agility": number,
  "strength": number,
  "awareness": number,
  "tackle": number,
  "hit_power": number,
  "block_shedding": number,
  "pursuit": number,
  "play_recognition": number,
  "zone_coverage": number,
  "man_coverage": number,
  "stamina": number,
  "injury": number
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.CornerBack]: `Extract ONLY these numeric CB attributes in exact format:
{
  "speed": number,
  "acceleration": number,
  "agility": number,
  "jumping": number,
  "awareness": number,
  "man_coverage": number,
  "zone_coverage": number,
  "press": number,
  "play_recognition": number,
  "catching": number,
  "tackle": number,
  "pursuit": number,
  "stamina": number,
  "injury": number
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.Safety]: `Extract ONLY these numeric Safety attributes in exact format:
{
  "speed": number,
  "acceleration": number,
  "agility": number,
  "jumping": number,
  "awareness": number,
  "zone_coverage": number,
  "man_coverage": number,
  "play_recognition": number,
  "tackle": number,
  "hit_power": number,
  "pursuit": number,
  "catching": number,
  "stamina": number,
  "injury": number
}
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,
  };

  constructor(
    private readonly ocrService: PlayerOcrService,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,
    private readonly cloudinaryService: CloudinaryService
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
    const { playerId, imageUrl, positionCode, originalName } = job.data;

    try {
      this.logger.log(`Starting attribute extraction for ${positionCode} player (ID: ${playerId})`);
      this.logger.log(`Processing image: ${originalName} for player: ${playerId}`);

      const player = await this.playerRepo.findOne({
        where: { id: playerId },
        relations: ['position'],
      });

      if (!player) {
        throw new Error(`Player with ID ${playerId} not found`);
      }

      // GPT call with retries
      let gptResult;
      const retryCount = 3;
      let attempts = 0;

      while (attempts < retryCount) {
        try {
          gptResult = await this.ocrService.callGptOcr(
            imageUrl,
            this.positionPrompts[positionCode]
          );
          break;
        } catch (error) {
          attempts++;
          if (attempts >= retryCount) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      // Convert the attributes with proper adjustments
      const newAttributes = await this.ocrService.convertAttributes(
        gptResult,
        positionCode,
        player
      );

      // Get existing attributes or create new empty ones
      let existingAttrs = await this.playerAttrRepo.findOne({
        where: { player: { id: playerId } },
      });

      if (!existingAttrs) {
        // Create new attributes if none exist
        existingAttrs = this.playerAttrRepo.create({
          ...newAttributes,
          player: { id: playerId },
        });
      } else {
        // Merge new attributes with existing ones
        Object.assign(existingAttrs, newAttributes);
      }

      // Save the merged attributes
      await this.playerAttrRepo.save(existingAttrs);

      this.logger.log(`Successfully processed attributes for player ${playerId}:`, newAttributes);

      return {
        status: 'success',
        playerId,
        positionCode,
        attributes: newAttributes,
        processedAt: new Date()
      };
    } catch (err) {
      this.logger.error(`Processing failed for player ${playerId}: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Failed to process player attributes: ${err.message}`);
    }
  }
}