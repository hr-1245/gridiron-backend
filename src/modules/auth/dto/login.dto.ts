import { IsEmail, IsNotEmpty } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class loginDto {
  @ApiProperty({ example: 'mushi1233666@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mushi1264273' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
