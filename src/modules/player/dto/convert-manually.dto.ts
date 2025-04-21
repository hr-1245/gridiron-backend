import { IsOptional } from "@nestjs/class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, } from "class-validator";

export class ConversionDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  positionId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  positionCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  playerName: string;

  data: ConverstionDataDto;

  @ApiProperty() @IsNumber()
  draft_round: number;

  @ApiProperty() @IsNumber() @IsOptional()
  ovr: number;

  @ApiProperty() @IsNumber() @IsOptional()
  weight: number

  @ApiProperty() @IsString() @IsOptional()
  height: string

  @ApiProperty() @IsString() @IsOptional()
  homeTown: string

  @ApiProperty() @IsString() @IsOptional()
  player_class: string

  @ApiProperty() @IsNumber() @IsOptional()
  projected_Reason: number
}

export class TightEndDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() break_tackle: number;
  @ApiProperty() @IsNumber() catch_in_traffic: number;
  @ApiProperty() @IsNumber() spectacular_catch: number;
  @ApiProperty() @IsNumber() release: number;
  @ApiProperty() @IsNumber() pass_block: number;
  @ApiProperty() @IsNumber() pass_block_power: number;
  @ApiProperty() @IsNumber() pass_block_finesse: number;
  @ApiProperty() @IsNumber() run_block: number;
  @ApiProperty() @IsNumber() run_block_power: number;
  @ApiProperty() @IsNumber() run_block_finesse: number;
  @ApiProperty() @IsNumber() lead_blocking: number;
  @ApiProperty() @IsNumber() impact_blocking: number;
  @ApiProperty() @IsNumber() jumping: number;
  @ApiProperty() @IsNumber() carrying: number;
  @ApiProperty() @IsNumber() trucking: number;
  @ApiProperty() @IsNumber() catching: number;
  @ApiProperty() @IsNumber() stiff_arm: number;
  @ApiProperty() @IsNumber() spin_move: number;
  @ApiProperty() @IsNumber() juke_move: number;
  @ApiProperty() @IsNumber() short_route_running: number;
  @ApiProperty() @IsNumber() medium_route_running: number;
  @ApiProperty() @IsNumber() deep_route_running: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;

}

export class QuarterBackDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() throw_power: number;
  @ApiProperty() @IsNumber() throw_accuracy_short: number;
  @ApiProperty() @IsNumber() throw_accuracy_mid: number;
  @ApiProperty() @IsNumber() throw_accuracy_deep: number;
  @ApiProperty() @IsNumber() throw_on_the_run: number;
  @ApiProperty() @IsNumber() throw_under_pressure: number;
  @ApiProperty() @IsNumber() play_action: number;
  @ApiProperty() @IsNumber() break_sack: number;
  @ApiProperty() @IsNumber() break_tackle: number;
  @ApiProperty() @IsNumber() trucking: number;
  @ApiProperty() @IsNumber() carrying: number;
  @ApiProperty() @IsNumber() ball_carrier_vision: number;
  @ApiProperty() @IsNumber() stiff_arm: number;
  @ApiProperty() @IsNumber() spin_move: number;
  @ApiProperty() @IsNumber() juke_move: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}

export class RunningBackDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() break_tackle: number;
  @ApiProperty() @IsNumber() carrying: number;
  @ApiProperty() @IsNumber() trucking: number;
  @ApiProperty() @IsNumber() pass_block: number;
  @ApiProperty() @IsNumber() ball_carrier_vision: number;
  @ApiProperty() @IsNumber() catching: number;
  @ApiProperty() @IsNumber() stiff_arm: number;
  @ApiProperty() @IsNumber() spin_move: number;
  @ApiProperty() @IsNumber() juke_move: number;
  @ApiProperty() @IsNumber() pass_blocking: number;
  @ApiProperty() @IsNumber() catch_in_traffic: number;
  @ApiProperty() @IsNumber() spectacular_catch: number;
  @ApiProperty() @IsNumber() short_route_running: number;
  @ApiProperty() @IsNumber() medium_route_running: number;
  @ApiProperty() @IsNumber() release: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() return: number;
  @ApiProperty() @IsNumber() injury: number;
}

export class WideReceiverDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() break_tackle: number;
  @ApiProperty() @IsNumber() catch_in_traffic: number;
  @ApiProperty() @IsNumber() spectacular_catch: number;
  @ApiProperty() @IsNumber() release: number;
  @ApiProperty() @IsNumber() jumping: number;
  @ApiProperty() @IsNumber() carrying: number;
  @ApiProperty() @IsNumber() trucking: number;
  @ApiProperty() @IsNumber() ball_carrier_vision: number;
  @ApiProperty() @IsNumber() catching: number;
  @ApiProperty() @IsNumber() stiff_arm: number;
  @ApiProperty() @IsNumber() spin_move: number;
  @ApiProperty() @IsNumber() juke_move: number;
  @ApiProperty() @IsNumber() short_route_running: number;
  @ApiProperty() @IsNumber() medium_route_running: number;
  @ApiProperty() @IsNumber() deep_route_running: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() return: number;
  @ApiProperty() @IsNumber() injury: number;
}

export class OffensiveLineDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() lead_block: number;
  @ApiProperty() @IsNumber() impact_blocking: number;
  @ApiProperty() @IsNumber() run_blocking: number;
  @ApiProperty() @IsNumber() pass_blocking: number;
  @ApiProperty() @IsNumber() pass_block_power: number;
  @ApiProperty() @IsNumber() pass_block_finesse: number;
  @ApiProperty() @IsNumber() run_block_power: number;
  @ApiProperty() @IsNumber() run_block_finesse: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}

export class DefensiveTackleDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() power_moves: number;
  @ApiProperty() @IsNumber() finesse_moves: number;
  @ApiProperty() @IsNumber() block_shedding: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}


export class CornerBackDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() catching: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() jumping: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() man_coverage: number;
  @ApiProperty() @IsNumber() zone_coverage: number;
  @ApiProperty() @IsNumber() press: number;
  @ApiProperty() @IsNumber() return: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class SafetyDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() catching: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() block_shed: number;
  @ApiProperty() @IsNumber() jumping: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() man_coverage: number;
  @ApiProperty() @IsNumber() zone_coverage: number;
  @ApiProperty() @IsNumber() press: number;
  @ApiProperty() @IsNumber() return: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class LeftGaurdDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() lead_block: number;
  @ApiProperty() @IsNumber() impact_blocking: number;
  @ApiProperty() @IsNumber() run_blocking: number;
  @ApiProperty() @IsNumber() pass_blocking: number;
  @ApiProperty() @IsNumber() pass_block_power: number;
  @ApiProperty() @IsNumber() pass_block_finesse: number;
  @ApiProperty() @IsNumber() run_block_power: number;
  @ApiProperty() @IsNumber() run_block_finesse: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class RightGaurdDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() lead_block: number;
  @ApiProperty() @IsNumber() impact_blocking: number;
  @ApiProperty() @IsNumber() run_blocking: number;
  @ApiProperty() @IsNumber() pass_blocking: number;
  @ApiProperty() @IsNumber() pass_block_power: number;
  @ApiProperty() @IsNumber() pass_block_finesse: number;
  @ApiProperty() @IsNumber() run_block_power: number;
  @ApiProperty() @IsNumber() run_block_finesse: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class LeftTackleDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() lead_block: number;
  @ApiProperty() @IsNumber() impact_block: number;
  @ApiProperty() @IsNumber() run_block: number;
  @ApiProperty() @IsNumber() pass_block: number;
  @ApiProperty() @IsNumber() pass_block_power: number;
  @ApiProperty() @IsNumber() pass_block_finesse: number;
  @ApiProperty() @IsNumber() run_block_power: number;
  @ApiProperty() @IsNumber() run_block_finesse: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class RightTackleDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() lead_block: number;
  @ApiProperty() @IsNumber() impact_block: number;
  @ApiProperty() @IsNumber() run_block: number;
  @ApiProperty() @IsNumber() pass_block: number;
  @ApiProperty() @IsNumber() pass_block_power: number;
  @ApiProperty() @IsNumber() pass_block_finesse: number;
  @ApiProperty() @IsNumber() run_block_power: number;
  @ApiProperty() @IsNumber() run_block_finesse: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}


export class LeftEndDTO {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() power_moves: number;
  @ApiProperty() @IsNumber() finesse_moves: number;
  @ApiProperty() @IsNumber() block_shed: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}

export class RightEndDTO {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() power_moves: number;
  @ApiProperty() @IsNumber() finesse_moves: number;
  @ApiProperty() @IsNumber() block_shed: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class Left_Outside_linebacker_above_245_lbsDTO {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() power_moves: number;
  @ApiProperty() @IsNumber() finesse_moves: number;
  @ApiProperty() @IsNumber() block_shed: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class Right_Outside_linebacker_above_245lbsDTO {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() power_moves: number;
  @ApiProperty() @IsNumber() finesse_moves: number;
  @ApiProperty() @IsNumber() block_shed: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class LeftOutside_linebacker_below_245lbsDTO {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() jumping: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() power_moves: number;
  @ApiProperty() @IsNumber() finesse_moves: number;
  @ApiProperty() @IsNumber() block_shedding: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() man_coverage: number;
  @ApiProperty() @IsNumber() zone_coverage: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class RightOutside_linebacker_below_245lbsDTO {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() jumping: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() power_moves: number;
  @ApiProperty() @IsNumber() finesse_moves: number;
  @ApiProperty() @IsNumber() block_shedding: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() man_coverage: number;
  @ApiProperty() @IsNumber() zone_coverage: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class All_Middle_LinebackersDTO {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() jumping: number;
  @ApiProperty() @IsNumber() tackling: number;
  @ApiProperty() @IsNumber() hit_power: number;
  @ApiProperty() @IsNumber() power_moves: number;
  @ApiProperty() @IsNumber() finesse_moves: number;
  @ApiProperty() @IsNumber() block_shedding: number;
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() man_coverage: number;
  @ApiProperty() @IsNumber() zone_coverage: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}

export class KickerDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() kick_power: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() kick_accuracy: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;

}
export class PunterDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() kick_power: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() kick_accuracy: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;

}
export class FullBackDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() lead_block: number;
  @ApiProperty() @IsNumber() run_block: number;
  @ApiProperty() @IsNumber() pass_block: number;
  @ApiProperty() @IsNumber() pass_block_power: number;
  @ApiProperty() @IsNumber() run_block_power: number;
  @ApiProperty() @IsNumber() pass_block_finesse: number;
  @ApiProperty() @IsNumber() run_block_finesse: number;
  @ApiProperty() @IsNumber() carrying: number;
  @ApiProperty() @IsNumber() catching: number;
  @ApiProperty() @IsNumber() catch_in_traffic: number;
  @ApiProperty() @IsNumber() short_route_running: number;
  @ApiProperty() @IsNumber() medium_route_running: number;
  @ApiProperty() @IsNumber() injury: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() impact_blocking: number;
  @ApiProperty() @IsNumber() stiff_arm: number;
  @ApiProperty() @IsNumber() trucking: number;
  @ApiProperty() @IsNumber() awareness: number;
}

export type ConverstionDataDto =
  | TightEndDto
  | QuarterBackDto
  | RunningBackDto
  | WideReceiverDto
  | OffensiveLineDto
  | DefensiveTackleDto
  | CornerBackDto
  | SafetyDto
  | LeftGaurdDto
  | RightGaurdDto
  | LeftTackleDto
  | RightTackleDto
  | LeftEndDTO
  | RightEndDTO
  | RightEndDTO
  | Left_Outside_linebacker_above_245_lbsDTO
  | Right_Outside_linebacker_above_245lbsDTO
  | LeftOutside_linebacker_below_245lbsDTO
  | RightOutside_linebacker_below_245lbsDTO
  | All_Middle_LinebackersDTO
  | KickerDto
  | FullBackDto
  | PunterDto