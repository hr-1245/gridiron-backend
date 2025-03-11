import { IsEmail, IsNotEmpty } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class loginDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1264273' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
