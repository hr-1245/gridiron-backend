import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

//#region attachPaymentMethodDto

export class AttachPaymentMethodDto {
  @ApiProperty({ description: 'The payment method ID to attach', example: 'pm_1GqIC8AbVXYZ' })
  paymentMethodId: string;
}

//#region checkoutSessionResponseDto
export class CheckoutSessionResponseDto {
  @ApiProperty({ description: 'The Stripe Checkout session ID', example: 'cs_test_a1b2c3d4e5' })
  sessionId: string;
}

//#region commonResponseDto
export class CommonResponseDto {
  @ApiProperty({ description: 'Response message', example: 'Payment method attached successfully' })
  message: string;
}


//#region userStripeInfoDto

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


//#region stripeCustomerInfoDto

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



//#region stripeCustomerResponseDto

export class StripeCustomerResponseDto {
  @ApiProperty({ example: 'Customer retrieved successfully' })
  message: string;

  @ApiProperty({ type: UserStripeInfoDto })
  user: UserStripeInfoDto;

  @ApiProperty({ type: StripeCustomerInfoDto })
  customer: StripeCustomerInfoDto;
}

//#region subscriptionResponseDto
export class SubscriptionResponseDto {
  subscriptionId: string;

  status: string;
}

//#region subscribeDto

export class SubscribeDto {
  @ApiProperty({ description: 'Full name of the user subscribing', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Phone number of the user subscribing', example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}


//#region subscriptionStatusDto

export class SubscriptionStatusDto {
  @ApiProperty({ description: 'Message regarding the subscription status', example: 'User is subscribed' })
  message: string;


  @ApiProperty({ description: 'Subscription status (e.g., succeeded, pending, canceled, none)', example: 'succeeded' })
  subscriptionStatus: string;

  @ApiProperty({ description: 'Stripe subscription ID if subscribed', example: 'sub_12345', required: false })
  subscriptionId?: string;
}



