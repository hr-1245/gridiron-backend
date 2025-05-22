import { IsOptional } from "@nestjs/class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, } from "class-validator";

export class EditDto {

  data: ConverstionDataDto;

  @ApiProperty() @IsOptional() @IsNumber()
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

  @ApiProperty() @IsString() @IsOptional()
  jerseyNumber: number

  @ApiProperty()
  @IsString()
  @IsOptional()
  draftFolderName?: string;
}

export class TightEndDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() break_tackle: number;
  @ApiProperty() @IsNumber() @IsOptional() catch_in_traffic: number;
  @ApiProperty() @IsNumber() @IsOptional() spectacular_catch: number;
  @ApiProperty() @IsNumber() @IsOptional() release: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() lead_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() impact_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() jumping: number;
  @ApiProperty() @IsNumber() @IsOptional() carrying: number;
  @ApiProperty() @IsNumber() @IsOptional() trucking: number;
  @ApiProperty() @IsNumber() @IsOptional() catching: number;
  @ApiProperty() @IsNumber() @IsOptional() stiff_arm: number;
  @ApiProperty() @IsNumber() @IsOptional() spin_move: number;
  @ApiProperty() @IsNumber() @IsOptional() juke_move: number;
  @ApiProperty() @IsNumber() @IsOptional() short_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() medium_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() deep_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;

}

export class QuarterBackDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() throw_power: number;
  @ApiProperty() @IsNumber() @IsOptional() throw_accuracy_short: number;
  @ApiProperty() @IsNumber() @IsOptional() throw_accuracy_mid: number;
  @ApiProperty() @IsNumber() @IsOptional() throw_accuracy_deep: number;
  @ApiProperty() @IsNumber() @IsOptional() throw_on_the_run: number;
  @ApiProperty() @IsNumber() @IsOptional() throw_under_pressure: number;
  @ApiProperty() @IsNumber() @IsOptional() play_action: number;
  @ApiProperty() @IsNumber() @IsOptional() break_sack: number;
  @ApiProperty() @IsNumber() @IsOptional() break_tackle: number;
  @ApiProperty() @IsNumber() @IsOptional() trucking: number;
  @ApiProperty() @IsNumber() @IsOptional() carrying: number;
  @ApiProperty() @IsNumber() @IsOptional() ball_carrier_vision: number;
  @ApiProperty() @IsNumber() @IsOptional() stiff_arm: number;
  @ApiProperty() @IsNumber() @IsOptional() spin_move: number;
  @ApiProperty() @IsNumber() @IsOptional() juke_move: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}

export class RunningBackDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() break_tackle: number;
  @ApiProperty() @IsNumber() @IsOptional() carrying: number;
  @ApiProperty() @IsNumber() @IsOptional() trucking: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block: number;
  @ApiProperty() @IsNumber() @IsOptional() ball_carrier_vision: number;
  @ApiProperty() @IsNumber() @IsOptional() catching: number;
  @ApiProperty() @IsNumber() @IsOptional() stiff_arm: number;
  @ApiProperty() @IsNumber() @IsOptional() spin_move: number;
  @ApiProperty() @IsNumber() @IsOptional() juke_move: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() catch_in_traffic: number;
  @ApiProperty() @IsNumber() @IsOptional() spectacular_catch: number;
  @ApiProperty() @IsNumber() @IsOptional() short_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() medium_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() release: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() return: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}

export class WideReceiverDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() break_tackle: number;
  @ApiProperty() @IsNumber() @IsOptional() catch_in_traffic: number;
  @ApiProperty() @IsNumber() @IsOptional() spectacular_catch: number;
  @ApiProperty() @IsNumber() @IsOptional() release: number;
  @ApiProperty() @IsNumber() @IsOptional() jumping: number;
  @ApiProperty() @IsNumber() @IsOptional() carrying: number;
  @ApiProperty() @IsNumber() @IsOptional() trucking: number;
  @ApiProperty() @IsNumber() @IsOptional() ball_carrier_vision: number;
  @ApiProperty() @IsNumber() @IsOptional() catching: number;
  @ApiProperty() @IsNumber() @IsOptional() stiff_arm: number;
  @ApiProperty() @IsNumber() @IsOptional() spin_move: number;
  @ApiProperty() @IsNumber() @IsOptional() juke_move: number;
  @ApiProperty() @IsNumber() @IsOptional() short_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() medium_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() deep_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() return: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}

export class OffensiveLineDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() lead_block: number;
  @ApiProperty() @IsNumber() @IsOptional() impact_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() run_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}

export class DefensiveTackleDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() power_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() finesse_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shedding: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}


export class CornerBackDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() catching: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() jumping: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() man_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() zone_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() press: number;
  @ApiProperty() @IsNumber() @IsOptional() return: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class SafetyDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() catching: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shed: number;
  @ApiProperty() @IsNumber() @IsOptional() jumping: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() man_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() zone_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() press: number;
  @ApiProperty() @IsNumber() @IsOptional() return: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class LeftGaurdDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() lead_block: number;
  @ApiProperty() @IsNumber() @IsOptional() impact_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() run_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class RightGaurdDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() lead_block: number;
  @ApiProperty() @IsNumber() @IsOptional() impact_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() run_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class LeftTackleDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() lead_block: number;
  @ApiProperty() @IsNumber() @IsOptional() impact_block: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class RightTackleDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() lead_block: number;
  @ApiProperty() @IsNumber() @IsOptional() impact_block: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}


export class LeftEndDTO {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() power_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() finesse_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shed: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}

export class RightEndDTO {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() power_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() finesse_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shed: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class Left_Outside_linebacker_above_245_lbsDTO {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() power_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() finesse_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shed: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class Right_Outside_linebacker_above_245lbsDTO {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() power_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() finesse_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shed: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class LeftOutside_linebacker_below_245lbsDTO {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() jumping: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() power_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() finesse_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shedding: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() man_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() zone_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class RightOutside_linebacker_below_245lbsDTO {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() jumping: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() power_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() finesse_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shedding: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() man_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() zone_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}
export class All_Middle_LinebackersDTO {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() jumping: number;
  @ApiProperty() @IsNumber() @IsOptional() tackling: number;
  @ApiProperty() @IsNumber() @IsOptional() hit_power: number;
  @ApiProperty() @IsNumber() @IsOptional() power_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() finesse_moves: number;
  @ApiProperty() @IsNumber() @IsOptional() block_shedding: number;
  @ApiProperty() @IsNumber() @IsOptional() pursuit: number;
  @ApiProperty() @IsNumber() @IsOptional() play_recognition: number;
  @ApiProperty() @IsNumber() @IsOptional() man_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() zone_coverage: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
}

export class KickerDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() kick_power: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() kick_accuracy: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;

}
export class PunterDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() kick_power: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
  @ApiProperty() @IsNumber() @IsOptional() kick_accuracy: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;

}
export class FullBackDto {
  @ApiProperty() @IsNumber() @IsOptional() age: number;
  @ApiProperty() @IsNumber() @IsOptional() speed: number;
  @ApiProperty() @IsNumber() @IsOptional() acceleration: number;
  @ApiProperty() @IsNumber() @IsOptional() agility: number;
  @ApiProperty() @IsNumber() @IsOptional() stamina: number;
  @ApiProperty() @IsNumber() @IsOptional() change_of_direction: number;
  @ApiProperty() @IsNumber() @IsOptional() lead_block: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_power: number;
  @ApiProperty() @IsNumber() @IsOptional() pass_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() run_block_finesse: number;
  @ApiProperty() @IsNumber() @IsOptional() carrying: number;
  @ApiProperty() @IsNumber() @IsOptional() catching: number;
  @ApiProperty() @IsNumber() @IsOptional() catch_in_traffic: number;
  @ApiProperty() @IsNumber() @IsOptional() short_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() medium_route_running: number;
  @ApiProperty() @IsNumber() @IsOptional() injury: number;
  @ApiProperty() @IsNumber() @IsOptional() strength: number;
  @ApiProperty() @IsNumber() @IsOptional() impact_blocking: number;
  @ApiProperty() @IsNumber() @IsOptional() stiff_arm: number;
  @ApiProperty() @IsNumber() @IsOptional() trucking: number;
  @ApiProperty() @IsNumber() @IsOptional() awareness: number;
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