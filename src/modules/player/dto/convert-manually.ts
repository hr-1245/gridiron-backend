import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class AttributeInputDto {
  @ApiProperty({
    description: "The key of the attribute (e.g., 'speed', 'strength')",
    example: "speed",
  })
  @IsNotEmpty()
  @IsString()
  attributeKey: string;

  @ApiProperty({
    description: "The value of the attribute provided by the user",
    example: 85,
  })
  @IsNotEmpty()
  @IsNumber()
  value: number;
}

export class PositionInputDto {
  @ApiProperty({
    description: "The code of the player position (e.g., 'QB', 'RB')",
    example: "QB",
  })
  @IsNotEmpty()
  @IsString()
  positionCode: string;

  @ApiProperty({
    description: "Array of attributes for the given position",
    type: [AttributeInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeInputDto)
  attributes: AttributeInputDto[];
}

export class convertManuallyDto {
  @ApiProperty({
    description: "Array of positions with their respective attributes",
    type: [PositionInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionInputDto)
  positions: PositionInputDto[];
}