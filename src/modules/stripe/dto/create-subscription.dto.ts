import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { subscriptionEnum } from 'src/types/enums/subscription';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Stripe Payment Method ID',
    example: 'pm_1JcD8TA2m5cvM9Zq4K8Hfs1O',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiProperty({
    description: 'Subscription type (Trial or Regular)',
    enum: subscriptionEnum,
    example: subscriptionEnum.TRIAL,
  })
  @IsEnum(subscriptionEnum, {
    message: `planType must be one of the following values: ${Object.values(subscriptionEnum).join(', ')}`,
  })
  planType: subscriptionEnum;

  @ApiPropertyOptional({
    description: 'Optional metadata for Stripe',
    example: '{"referral": "partner123"}',
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}
