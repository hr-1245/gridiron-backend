import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  fullName: string

}