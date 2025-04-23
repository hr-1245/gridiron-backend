import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class DiscountConfigDto {
  @ApiProperty({ description: 'Discount percentage (0-100)', example: 20 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  percentage: number;

  @ApiProperty({ description: 'Name of the discount', example: 'Spring Sale', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Whether this discount is active', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}

// For completeness, including the existing DTOs
export class SubscribeDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class AttachPaymentMethodDto {
  @ApiProperty({ description: 'Stripe Payment Method ID', example: 'pm_12345678' })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}