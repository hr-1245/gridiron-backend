import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PositionAttributeDto {
  @ApiProperty({ description: "The key of the attribute (e.g., 'speed')", example: "speed" })
  attributeKey: string;

  @ApiProperty({ description: "The conversion logic for the attribute", example: "x * 2" })
  conversionLogic?: string;

  @ApiProperty({ description: "The display order of the attribute", example: 1 })
  displayOrder?: number;
}

export class PositionAttributesResponseDto {

  @ApiProperty()
  message: string

  @ApiProperty({ description: "The code of the position", example: "QB" })
  positionCode: string;

  @ApiProperty({ description: "The name of the position", example: "Quarter Back" })
  positionName: string;

  @ApiProperty({
    description: "The list of attributes for the position",
    type: [PositionAttributeDto],
  })
  attributes: PositionAttributeDto[];
}

export class FetchPositionAttributesDto {
  @ApiProperty({
    description: "The code or name of the position (e.g., 'QB' or 'Quarter Back')",
    example: "QB",
  })
  @IsNotEmpty()
  @IsString()
  position: string; // Can be either code or name
}
