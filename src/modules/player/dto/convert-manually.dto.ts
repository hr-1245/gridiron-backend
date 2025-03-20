import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

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

  @ApiProperty()
  @IsNumber()
  data: ConverstionDataDto
}

export class TightEndDto extends ConversionDto {
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

export class QuarterBackDto extends ConversionDto {
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
  @ApiProperty() @IsNumber() spin_move: number;
  @ApiProperty() @IsNumber() juke_move: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}

export class RunningBackDto extends ConversionDto {
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
  @ApiProperty() @IsNumber() injury: number;
}

export class WideReceiverDto extends ConversionDto {
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
  @ApiProperty() @IsNumber() injury: number;
}

export class OffensiveLineDto extends ConversionDto {
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

export class DefensiveEndDto extends ConversionDto {
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

export class LineBeckerDto extends ConversionDto {
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
export class CornerBackDto extends ConversionDto {
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
  @ApiProperty() @IsNumber() pursuit: number;
  @ApiProperty() @IsNumber() play_recognition: number;
  @ApiProperty() @IsNumber() man_coverage: number;
  @ApiProperty() @IsNumber() zone_coverage: number;
  @ApiProperty() @IsNumber() press: number;
  @ApiProperty() @IsNumber() return: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class SafetyDto extends ConversionDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() change_of_direction: number;
  @ApiProperty() @IsNumber() awareness: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() jumping: number;
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
export class InteriorOffensiveLinemanDto extends ConversionDto {
  @ApiProperty() @IsNumber() age: number;
  @ApiProperty() @IsNumber() speed: number;
  @ApiProperty() @IsNumber() acceleration: number;
  @ApiProperty() @IsNumber() agility: number;
  @ApiProperty() @IsNumber() strength: number;
  @ApiProperty() @IsNumber() lead_block: number;
  @ApiProperty() @IsNumber() run_blocking: number;
  @ApiProperty() @IsNumber() pass_blocking: number;
  @ApiProperty() @IsNumber() pass_block_power: number;
  @ApiProperty() @IsNumber() pass_block_finesse: number;
  @ApiProperty() @IsNumber() run_block_power: number;
  @ApiProperty() @IsNumber() run_block_finesse: number;
  @ApiProperty() @IsNumber() stamina: number;
  @ApiProperty() @IsNumber() injury: number;
}
export class OffensiveTackleDto extends ConversionDto {
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
export class EdgeRusherDto extends ConversionDto {
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


export type ConverstionDataDto =
  | TightEndDto
  | QuarterBackDto
  | RunningBackDto
  | WideReceiverDto
  | OffensiveLineDto
  | DefensiveEndDto
  | LineBeckerDto
  | CornerBackDto
  | SafetyDto
  | InteriorOffensiveLinemanDto
  | OffensiveTackleDto
  | EdgeRusherDto