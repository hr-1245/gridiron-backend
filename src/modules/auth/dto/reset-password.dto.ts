import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class ResetPasswordDTO {
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'OTP sent to email',
    example: 123456,
  })
  @IsNumber()
  @IsNotEmpty()
  otp: number;

  @ApiProperty({
    description: 'New password',
    example: 'newStrongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}