// src/modules/auth/dto/verify-email.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'OTP code sent to the email',
    example: 123456,
    required: true
  })
  @IsNumber({}, { message: 'OTP must be a number' })
  @IsNotEmpty({ message: 'OTP is required' })
  otp: number;
}


export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email address to send verification code',
    example: 'user@example.com',
    required: true
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}