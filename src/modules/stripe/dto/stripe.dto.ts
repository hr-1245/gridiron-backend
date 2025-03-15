import { ApiProperty } from '@nestjs/swagger';
import { subscriptionEnum } from 'src/types/enums/subscription';

export class AttachPaymentMethodDto {
  @ApiProperty({ description: 'The payment method ID to attach', example: 'pm_1GqIC8AbVXYZ' })
  paymentMethodId: string;
}


export class CheckoutSessionResponseDto {
  @ApiProperty({ description: 'The Stripe Checkout session ID', example: 'cs_test_a1b2c3d4e5' })
  sessionId: string;
}


export class CommonResponseDto {
  @ApiProperty({ description: 'Response message', example: 'Payment method attached successfully' })
  message: string;
}



export class UserStripeInfoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'cus_ABC123' })
  stripeCustomerId: string;

  @ApiProperty({ description: 'Optional payment method ID', example: 'pm_1234567890', required: false })
  paymentMethodId?: string;
}



export class StripeCustomerInfoDto {
  @ApiProperty({ example: 'cus_ABC123' })
  id: string;

  @ApiProperty({ example: 'user@example.com', nullable: true })
  email?: string;

  @ApiProperty({ description: 'Invoice settings of the customer' })
  invoiceSettings: any;

  @ApiProperty({ description: 'Default payment method details', nullable: true })
  defaultPaymentMethod?: any;

  @ApiProperty({ description: 'Metadata of the customer', nullable: true })
  metadata?: any;
}




export class StripeCustomerResponseDto {
  @ApiProperty({ example: 'Customer retrieved successfully' })
  message: string;

  @ApiProperty({ type: UserStripeInfoDto })
  user: UserStripeInfoDto;

  @ApiProperty({ type: StripeCustomerInfoDto })
  customer: StripeCustomerInfoDto;
}


export class SubscriptionResponseDto {
  @ApiProperty({ description: 'The Stripe subscription ID', example: 'sub_1ABCDEF...' })
  subscriptionId: string;

  @ApiProperty({ description: 'The subscription status', })
  status: string;
}
