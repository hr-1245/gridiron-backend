import { rolesEnum } from "src/types/enums/roles";

export interface userjwtInterface {
  id: number;
  email: string;
  role: rolesEnum
}

export interface adminJwtInterface {
  id: number;
  email: string
  role: rolesEnum
}

// update-position.dto.ts
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class UpdatePositionDto {
  @IsNumber()
  positionId: number;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
