import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class InitiateSignupDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
