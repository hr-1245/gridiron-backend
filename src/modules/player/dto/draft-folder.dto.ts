import { IsOptional, IsNumberString, IsString } from 'class-validator';

export class GetDraftFoldersQueryDto {
  @IsOptional()
  @IsNumberString()
  searchId?: string;

  @IsOptional()
  @IsString()
  searchName?: string;
}
