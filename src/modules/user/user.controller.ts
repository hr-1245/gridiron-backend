import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';
import { User } from 'src/utils/user.decorator';
import { StripeService } from '../stripe/stripe.service';
import { userjwtInterface } from '../jwt/interface/jwt.interface';
import { AttachPaymentMethodDto, CheckoutSessionResponseDto, CommonResponseDto, StripeCustomerResponseDto, SubscribeDto, SubscriptionResponseDto, SubscriptionStatusDto } from '../stripe/dto/stripe.dto';

@ApiTags('Stripe')
@ApiBearerAuth('jwt')
@Controller('stripe')
@UseGuards(userjwtGuard)
export class userController {
  constructor(private readonly stripeService: StripeService) { }


  //======================================GET CUSTOMER DETAIL API=========================================================

  @ApiOperation({ summary: 'Retrieve Stripe customer details' })
  @ApiResponse({ status: 200, description: 'Stripe customer retrieved successfully', type: StripeCustomerResponseDto })
  @Get('customer')
  async retrieveCustomer(@User() user: userjwtInterface): Promise<StripeCustomerResponseDto> {
    return this.stripeService.getStripeCustomer(user.id);
  }

  @ApiOperation({ summary: 'Create a Stripe Checkout Session for subscription' })
  @ApiResponse({ status: 200, description: 'Checkout session created successfully', type: CheckoutSessionResponseDto })
  @Post('checkout')
  async createCheckout(@User() user: userjwtInterface): Promise<CheckoutSessionResponseDto> {
    return this.stripeService.createCheckoutSession(user.id);
  }


  // ======================================ATTACH PAYMENT-METHODAPI========================================================= 


  @ApiOperation({ summary: 'Attach a payment method to the user’s Stripe account' })
  @ApiResponse({ status: 200, description: 'Payment method attached successfully', type: CommonResponseDto })
  @Post('attach-payment-method')
  async attachPaymentMethod(
    @User() user: userjwtInterface,
    @Body() attachPaymentMethodDto: AttachPaymentMethodDto,
  ): Promise<CommonResponseDto> {
    return this.stripeService.attachPaymentMethod(user.id, attachPaymentMethodDto.paymentMethodId);
  }

  @ApiOperation({ summary: 'Create a subscription directly for the Regular Plan' })
  @ApiResponse({ status: 200, description: 'Subscription created successfully', type: SubscriptionResponseDto })
  @Post('subscribe')
  async subscribe(
    @User() user: userjwtInterface,
    @Body() subscribeDto: SubscribeDto,
  ): Promise<SubscriptionResponseDto & { message: string }> {
    return this.stripeService.createSubscription(user.id, subscribeDto);
  }

  //======================================SUBSCRIPTION STATUS API=========================================================


  @ApiOperation({ summary: 'Get the subscription status for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved successfully', type: SubscriptionStatusDto })
  @Get('subscription-status')
  async getSubscriptionStatus(@User() user: userjwtInterface): Promise<SubscriptionStatusDto> {
    return this.stripeService.getSubscriptionStatus(user.id);
  }


  //======================================UNSUBSCRIBE API=========================================================

  @ApiOperation({ summary: 'Cancel the user’s subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully', type: CommonResponseDto })
  @Delete('unsubscribe')
  async cancelSubscription(@User() user: userjwtInterface): Promise<CommonResponseDto> {
    return this.stripeService.cancelSubscription(user.id);
  }
}
