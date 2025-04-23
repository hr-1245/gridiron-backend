import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PlayerOcrService } from 'src/modules/player/services/playerocr.service';
import { PlayerEntity, PlayerAttributesEntity } from 'src/modules/player/entity/players.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTION_CODE } from 'src/types/enums/roles';

@Injectable()
@Processor('imageProcessing')
export class bullService {
  private readonly positionPrompts = {
    [POSTION_CODE.QuarterBack]: `Extract ONLY these numeric QB attributes from the image and return in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "awareness": number,
      "throw_power": number,  // Also known as "Throw Power" in image
      "throw_accuracy_short": number,  // Also known as "Short Throw Accuracy" in image
      "throw_accuracy_mid": number,  // Also known as "Medium Throw Accuracy" in image
      "throw_accuracy_deep": number,  // Also known as "Deep Throw Accuracy" in image
      "throw_on_the_run": number,  // Also known as "Throw on the Run" in image
      "throw_under_pressure": number,  // Also known as "Throw Under Pressure" in image
      "play_action": number,  // Also known as "Play Action" in image
      "break_sack": number,  // Also known as "Break Sack" in image
      "break_tackle": number,  // Also known as "Break Tackle" in image
      "trucking": number,
      "carrying": number,
      "ball_carrier_vision": number,  // Also known as "Ball Carrier Vision" in image
      "spin_move": number,  // Also known as "Spin Move" in image
      "juke_move": number,  // Also known as "Juke Move" in image
      "stamina": number,
      "injury": number
      "strength": number
      "jumping": number
    }
    // QB-specific attributes focused on throwing accuracy, power, and mobility
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.RunningBack]: `Extract ONLY these numeric RB attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "change_of_direction": number,  // Also known as "Change of Direction" or "COD" in image
      "strength": number,
      "awareness": number,
      "break_tackle": number,  // Also known as "Break Tackle" in image
      "carrying": number,
      "trucking": number,
      "ball_carrier_vision": number,  // Also known as "Ball Carrier Vision" in image
      "catching": number,
      "stiff_arm": number,  // Also known as "Stiff Arm" in image
      "spin_move": number,  // Also known as "Spin Move" in image
      "juke_move": number,  // Also known as "Juke Move" in image
      "pass_blocking": number,  // Also known as "Pass Block" in image
      "catch_in_traffic": number,  // Also known as "Catch In Traffic" in image
      "spectacular_catch": number,  // Also known as "Spectacular Catch" or "SPC" in image
      "short_route_running": number,  // Also known as "Short Route Running" in image
      "medium_route_running": number,  // Also known as "Medium Route Running" in image
      "release": number,
      "stamina": number,
      "return": number,  // Also known as "Kick Return" in image
      "injury": number
    }
    // RB-specific attributes focused on rushing, receiving, and ball carrier skills
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.WiderReceiver]: `Extract ONLY these numeric WR attributes from the image and return in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "change_of_direction": number,  // Also known as "Change of Direction" or "COD" in image
      "strength": number,
      "awareness": number,
      "break_tackle": number,  // Also known as "Break Tackle" in image
      "catch_in_traffic": number,  // Also known as "Catch In Traffic" in image
      "spectacular_catch": number,  // Also known as "Spectacular Catch" or "SPC" in image
      "release": number,
      "jumping": number,
      "carrying": number,
      "trucking": number,
      "ball_carrier_vision": number,  // Also known as "Ball Carrier Vision" in image
      "catching": number,
      "stiff_arm": number,  // Also known as "Stiff Arm" in image
      "spin_move": number,  // Also known as "Spin Move" in image
      "juke_move": number,  // Also known as "Juke Move" in image
      "short_route_running": number,  // Also known as "Short Route Running" in image
      "medium_route_running": number,  // Also known as "Medium Route Running" in image
      "deep_route_running": number,  // Also known as "Deep Route Running" in image
      "jumping": number,
      "stamina": number,
      "return": number,  // Also known as "Kick Return" in image
      "injury": number
    }
    // WR-specific attributes focused on receiving, route running, and after-catch skills
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.TightEnd]: `Extract ONLY these numeric TE attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "change_of_direction": number,  // Also known as "Change of Direction" or "COD" in image
      "strength": number,
      "awareness": number,
      "break_tackle": number,  // Also known as "Break Tackle" in image
      "catch_in_traffic": number,  // Also known as "Catch In Traffic" in image
      "spectacular_catch": number,  // Also known as "Spectacular Catch" or "SPC" in image
      "release": number,
      "pass_block": number,  // Also known as "Pass Block" in image
      "pass_block_power": number,  // Also known as "Pass Block Power" in image
      "pass_block_finesse": number,  // Also known as "Pass Block Finesse" in image
      "run_block": number,  // Also known as "Run Block" in image
      "run_block_power": number,  // Also known as "Run Block Power" in image
      "run_block_finesse": number,  // Also known as "Run Block Finesse" in image
      "lead_blocking": number,  // Also known as "Lead Block" in image
      "impact_blocking": number,  // Also known as "Impact Block" in image
      "jumping": number,
      "carrying": number,
      "trucking": number,
      "catching": number,
      "stiff_arm": number,  // Also known as "Stiff Arm" in image
      "spin_move": number,  // Also known as "Spin Move" in image
      "juke_move": number,  // Also known as "Juke Move" in image
      "short_route_running": number,  // Also known as "Short Route Running" in image
      "medium_route_running": number,  // Also known as "Medium Route Running" in image
      "deep_route_running": number,  // Also known as "Deep Route Running" in image
      "jumping": number,
      "stamina": number,
      "injury": number
    }
    // TE-specific attributes combining receiving skills with blocking abilities
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,



    [POSTION_CODE.DefensiveTackle]: `Extract ONLY these numeric DT attributes in exact format:
    {
      "speed": number,
      "accleration": number,
      "agility": number,
      "awareness": number,
      "strength": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "power_moves": number,  // Also known as "Power Moves" in image
      "finesse_moves": number,  // Also known as "Finesse Moves" in image
      "block_shedding": number,  // Also known as "Block Shed" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "stamina": number,
      "injury": number
    }
    // DT-specific attributes focused on interior defensive line play
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.LeftOutside_linebacker_below_245lbs]: `Extract ONLY these numeric LOLB< attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "change_of_direction": number,  // Also known as "Change of Direction" or "COD" in image
      "awareness": number,
      "strength": number,
      "jumping": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "power_moves": number,  // Also known as "Power Moves" in image
      "finesse_moves": number,  // Also known as "Finesse Moves" in image
      "block_shedding": number,  // Also known as "Block Shed" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "man_coverage": number,  // Also known as "Man Coverage" in image
      "zone_coverage": number,  // Also known as "Zone Coverage" in image
      "stamina": number,
      "injury": number
    }
    // LOLB< (light) attributes focused on pass rushing and coverage skills
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.RightOutside_linebacker_below_245lbs]: `Extract ONLY these numeric ROLB< attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "change_of_direction": number,  // Also known as "Change of Direction" or "COD" in image
      "awareness": number,
      "strength": number,
      "jumping": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "power_moves": number,  // Also known as "Power Moves" in image
      "finesse_moves": number,  // Also known as "Finesse Moves" in image
      "block_shedding": number,  // Also known as "Block Shed" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "man_coverage": number,  // Also known as "Man Coverage" in image
      "zone_coverage": number,  // Also known as "Zone Coverage" in image
      "stamina": number,
      "injury": number
    }
    // ROLB< (light) attributes similar to LOLB< but for right side
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.All_Middle_Linebackers]: `Extract ONLY these numeric MLB attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "change_of_direction": number,  // Also known as "Change of Direction" or "COD" in image
      "awareness": number,
      "strength": number,
      "jumping": number,
      "tackle": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "power_moves": number,  // Also known as "Power Moves" in image
      "finesse_moves": number,  // Also known as "Finesse Moves" in image
      "block_shedding": number,  // Also known as "Block Shed" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "man_coverage": number,  // Also known as "Man Coverage" in image
      "zone_coverage": number,  // Also known as "Zone Coverage" in image
      "stamina": number,
      "injury": number
    }
    // MLB attributes focused on run stopping and coverage in the middle of the field
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.CornerBack]: `Extract ONLY these numeric CB attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "change_of_direction": number,  // Also known as "Change of Direction" or "COD" in image
      "awareness": number,
      "strength": number,
      "jumping": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "man_coverage": number,  // Also known as "Man Coverage" in image
      "zone_coverage": number,  // Also known as "Zone Coverage" in image
      "press": number,  // Also known as "Press" in image
      "return": number,  // Also known as "Kick Return" in image
      "stamina": number,
      "injury": number
    }
    // CB attributes focused on coverage skills, speed, and ball skills
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.Safety]: `Extract ONLY these numeric S attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "change_of_direction": number,  // Also known as "Change of Direction" or "COD" in image
      "catching": number,
      "awareness": number,
      "strength": number,
      "block_shed": number,  // Also known as "Block Shed" in image
      "jumping": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "man_coverage": number,  // Also known as "Man Coverage" in image
      "zone_coverage": number,  // Also known as "Zone Coverage" in image
      "press": number,  // Also known as "Press" in image
      "stamina": number,
      "injury": number
    }
    // Safety attributes combining coverage skills with run support
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.LeftGuard]: `Extract ONLY these numeric LG attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "strength": number,
      "lead_block": number,  // Also known as "Lead Block" in image
      "impact_blocking": number,  // Also known as "Impact Block" in image
      "run_blocking": number,  // Also known as "Run Block" in image
      "pass_blocking": number,  // Also known as "Pass Block" in image
      "pass_block_power": number,  // Also known as "Pass Block Power" in image
      "pass_block_finesse": number,  // Also known as "Pass Block Finesse" in image
      "run_block_power": number,  // Also known as "Run Block Power" in image
      "run_block_finesse": number,  // Also known as "Run Block Finesse" in image
      "stamina": number,
      "injury": number
    }
    // LG-specific attributes focused on interior line blocking
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.RightGuard]: `Extract ONLY these numeric RG attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "strength": number,
      "lead_block": number,  // Also known as "Lead Block" in image
      "impact_blocking": number,  // Also known as "Impact Block" in image
      "run_blocking": number,  // Also known as "Run Block" in image
      "pass_blocking": number,  // Also known as "Pass Block" in image
      "pass_block_power": number,  // Also known as "Pass Block Power" in image
      "pass_block_finesse": number,  // Also known as "Pass Block Finesse" in image
      "run_block_power": number,  // Also known as "Run Block Power" in image
      "run_block_finesse": number,  // Also known as "Run Block Finesse" in image
      "stamina": number,
      "injury": number
    }
    // RG-specific attributes similar to LG but for right side
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.LeftTackle]: `Extract ONLY these numeric LT attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "awareness": number,
      "agility": number,
      "strength": number,
      "lead_block": number,  // Also known as "Lead Block" in image
      "impact_blocking": number,  // Also known as "Impact Block" in image
      "run_blocking": number,  // Also known as "Run Block" in image
      "pass_blocking": number,  // Also known as "Pass Block" in image
      "pass_block_power": number,  // Also known as "Pass Block Power" in image
      "pass_blocking_finesse": number,  // Also known as "Pass Block Finesse" in image
      "run_block_power": number,  // Also known as "Run Block Power" in image
      "run_block_finesse": number,  // Also known as "Run Block Finesse" in image
      "stamina": number,
      "injury": number
    }
    // LT-specific attributes focused on pass protection and edge blocking
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.RightTackle]: `Extract ONLY these numeric RT attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "awareness": number,
      "agility": number,
      "strength": number,
      "lead_block": number,  // Also known as "Lead Block" in image
      "impact_blocking": number,  // Also known as "Impact Block" in image
      "run_blocking": number,  // Also known as "Run Block" in image
      "pass_blocking": number,  // Also known as "Pass Block" in image
      "pass_block_power": number,  // Also known as "Pass Block Power" in image
      "pass_blocking_finesse": number,  // Also known as "Pass Block Finesse" in image
      "run_block_power": number,  // Also known as "Run Block Power" in image
      "run_block_finesse": number,  // Also known as "Run Block Finesse" in image
      "stamina": number,
      "injury": number
    }
    // RT-specific attributes similar to LT but for right side
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.LeftEnd]: `Extract ONLY these numeric LE attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "awareness": number,
      "strength": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "power_moves": number,  // Also known as "Power Moves" in image
      "finesse_moves": number,  // Also known as "Finesse Moves" in image
      "block_shedding": number,  // Also known as "Block Shed" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "stamina": number,
      "injury": number
    }
    // LE attributes focused on edge rushing and run defense
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.RightEnd]: `Extract ONLY these numeric RE attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "awareness": number,
      "strength": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "power_moves": number,  // Also known as "Power Moves" in image
      "finesse_moves": number,  // Also known as "Finesse Moves" in image
      "block_shedding": number,  // Also known as "Block Shed" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "stamina": number,
      "injury": number
    }
    // RE attributes similar to LE but for right side
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.LeftOutside_linebacker_above_245_lbs]: `Extract ONLY these numeric LOLB> attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "awareness": number,
      "strength": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "power_moves": number,  // Also known as "Power Moves" in image
      "finesse_moves": number,  // Also known as "Finesse Moves" in image
      "block_shedding": number,  // Also known as "Block Shed" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "stamina": number,
      "injury": number
    }
    // LOLB> (heavy) attributes focused on power rushing and run defense
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.RightOutside_linebacker_above_245lbs]: `Extract ONLY these numeric ROLB> attributes in exact format:
    {
      "speed": number,
      "acceleration": number,
      "agility": number,
      "awareness": number,
      "strength": number,
      "tackling": number,
      "hit_power": number,  // Also known as "Hit Power" in image
      "power_moves": number,  // Also known as "Power Moves" in image
      "finesse_moves": number,  // Also known as "Finesse Moves" in image
      "block_shedding": number,  // Also known as "Block Shed" in image
      "pursuit": number,
      "play_recognition": number,  // Also known as "Play Recognition" in image
      "stamina": number,
      "injury": number
    }
    // ROLB> (heavy) attributes similar to LOLB> but for right side
    Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,
    [POSTION_CODE.Kicker]: `Extract ONLY these numeric K attributes in exact format:
{
  "kick_power": number,  // Also known as "Kick power" in image
  "awareness": number,  // Also known as "Awareness" in image
  "kick_accuracy": number,  // Also known as "Kick accuracy" in image
  "speed": number,  // Also known as "Speed" in image
  "acceleration": number,  // Also known as "Acceleration" in image
  "stamina": number,
  "injury": number
}
// Kicker-specific attributes focused on kicking skills and athleticism
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.Punter]: `Extract ONLY these numeric P attributes in exact format:
{
  "kick_power": number,  // Also known as "Kick power"  in image
  "awareness": number,  // Also known as "Awareness"  in image
  "kick_accuracy": number,  // Also known as "Kick accuracy"  in image
  "speed": number,  // Also known as "Speed"  in image
  "acceleration": number,  // Also known as "Acceleration"  in image
  "stamina": number,
  "injury": number
}
// Punter-specific attributes focused on punting skills and athleticism
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`,

    [POSTION_CODE.FullBack]: `Extract ONLY these numeric FB attributes in exact format:
{
  "speed": number,  // Also known as "Speed"  in image
  "acceleration": number,  // Also known as "Acceleration"  in image
  "agility": number,  // Also known as "Agility"  in image
  "stamina": number,  // Also known as "Stamina"  in image
  "change_of_direction": number,  // Also known as "Change of Direction" in image
  "lead_block": number,  // Also known as "Lead Block" in image
  "run_block": number,  // Also known as "Run Block" in image
  "pass_block": number,  // Also known as "Pass Block" in image
  "pass_block_power": number,  // Also known as "Pass block power" in image
  "run_block_power": number,  // Also known as "Run block power" in image
  "pass_block_finesse": number,  // Also known as "Pass block finesse" in image
  "run_block_finesse": number,  // Also known as "Run block finesse" in image
  "carrying": number,
  "catching": number,
  "catch_in_traffic": number,  // Also known as "Catch in Traffic" in image
  "short_route_running": number,  // Also known as "Short route running" in image
  "medium_route_running": number,  // Also known as "Medium route running" in image
  "injury": number,
  "strength": number,
  "impact_blocking": number,  // Also known as "Impact blocking" in image
  "stiff_arm": number,  // Also known as "Stiff arm" in image
  "trucking": number,
  "awareness": number  // Also known as "Awareness  in image
}
// Fullback attributes combining blocking skills with rushing/receiving capabilities
Return ONLY the JSON, no explanations or comments. Use the exact attribute names as shown. Only include attributes visible in the image with numeric values.`
  };//need some kind of work maybe later

  constructor(
    private readonly ocrService: PlayerOcrService,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,
  ) { }

  private readonly logger = new Logger(bullService.name);


  @OnQueueActive()
  onActive(job: Job) {
    const { playerId, originalName } = job.data || {};
    this.logger.log(`Processing job ${job.id}: ${originalName ?? 'Unknown'} for player ${playerId ?? 'N/A'}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    const { playerId } = job.data || {};
    this.logger.log(`Job ${job.id} completed for player ${playerId}`);
    this.logger.debug(`Job result: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  async onFailed(job: Job, err: Error) {
    const { playerId, originalName, bulkJobId } = job.data || {};
    this.logger.error(`[${bulkJobId}] Job ${job.id} failed for player ${playerId} (${originalName}): ${err.message}`);

    if (job.attemptsMade < (job.opts?.attempts || 0)) {
      const delay = typeof job.opts?.backoff === 'object' ? job.opts.backoff.delay : 1000;
      this.logger.warn(`[${bulkJobId}] Will retry job (attempt ${job.attemptsMade + 1}) in ${delay}ms`);
      return;
    }

    try {
      await this.playerRepo.update(playerId, {});
    } catch (dbError) {
      this.logger.error(`[${bulkJobId}] Failed to update player status: ${dbError.message}`);
    }
  }

  @Process('processImage')
  async handleImageProcessing(job: Job<{
    userId: number;
    playerId: number;
    imageUrl: string;
    originalName: string;
    positionCode: string;
    bulkJobId?: string;
  }>) {
    const { playerId, imageUrl, positionCode, bulkJobId } = job.data;

    try {
      const player = await this.fetchPlayer(playerId);

      const positionPrompt = this.positionPrompts[positionCode];
      if (!positionPrompt) {
        throw new Error(`No prompt defined for position ${positionCode}`);
      }

      const gptResult = await this.getGptResultWithRetry(imageUrl, positionPrompt, bulkJobId);
      const newAttributes = await this.ocrService.convertAttributes(gptResult, positionCode, player);

      await this.savePlayerAttributes(playerId, newAttributes, player.name);

      this.logger.log(`[${bulkJobId}] Finished processing for player ${playerId} (${player.name})`);
      return this.createProcessingResponse(newAttributes, playerId, positionCode, bulkJobId);
    } catch (error) {
      this.logger.error(`[${bulkJobId}] Failed to process attributes for player ${playerId}: ${error.message}`);
      throw new Error(`Attribute processing failed: ${error.message}`);
    }
  }

  private async fetchPlayer(playerId: number): Promise<PlayerEntity> {
    const player = await this.playerRepo.findOne({
      where: { id: playerId },
      relations: ['position'],
    });

    if (!player) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    return player;
  }

  private async getGptResultWithRetry(imageUrl: string, positionPrompt: string, bulkJobId?: string): Promise<any> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.ocrService.callGptOcr(imageUrl, positionPrompt);
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        await this.retryDelay(attempt, bulkJobId);
      }
    }
  }

  private async retryDelay(attempt: number, bulkJobId?: string): Promise<void> {
    const delay = 1000 * Math.pow(2, attempt);
    this.logger.warn(`[${bulkJobId}] Retry ${attempt} in ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async savePlayerAttributes(playerId: number, newAttributes: any, playerName: string): Promise<void> {
    await this.playerAttrRepo.manager.transaction(async (em) => {
      let existingAttrs = await em.findOne(PlayerAttributesEntity, {
        where: { player: { id: playerId } },
      });

      if (!existingAttrs) {
        const created = em.create(PlayerAttributesEntity, {
          ...newAttributes,
          player: { id: playerId },
        });
        await em.save(created);
      } else {
        em.merge(PlayerAttributesEntity, existingAttrs, newAttributes);
        await em.save(existingAttrs);
      }
    });
  }

  private createProcessingResponse(newAttributes: any, playerId: number, positionCode: string, bulkJobId?: string) {
    return {
      status: 'success',
      playerId,
      positionCode,
      attributes: Object.keys(newAttributes).length,
      processedAt: new Date(),
      bulkJobId,
    };
  }

  @Process('processBulkAttributes')
  async handleBulkImageProcessing(job: Job<{
    userIds: number[];
    files: Array<{
      playerId: number;
      positionCode: string;
      url: string;
      originalName: string;
    }>;
  }>) {
    const { files } = job.data;

    const filesByPlayer = files.reduce((acc, file) => {
      if (!acc[file.playerId]) {
        acc[file.playerId] = [];
      }
      acc[file.playerId].push(file);
      return acc;
    }, {} as Record<number, typeof files>);

    const results = await Promise.all(
      Object.entries(filesByPlayer).map(async ([playerIdStr, playerFiles]) => {
        const playerId = parseInt(playerIdStr, 10);
        const positionCode = playerFiles[0].positionCode;
        const bulkJobId = `bulk-${playerId}-${Date.now()}`;

        for (const file of playerFiles) {
          await this.handleImageProcessing({
            data: {
              userId: 0, // Replace with real user ID if needed
              playerId,
              imageUrl: file.url,
              originalName: file.originalName,
              positionCode,
              bulkJobId,
            },
          } as Job);
        }

        return {
          playerId,
          bulkJobId,
          status: 'completed',
          processedAt: new Date(),
        };
      })
    );

    return {
      totalPlayers: results.length,
      processedAt: new Date(),
      results,
    };
  }
}