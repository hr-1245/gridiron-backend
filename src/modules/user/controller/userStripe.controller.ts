import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';
import { StripeService } from '../../stripe/stripe.service';
import { User } from 'src/utils/user.decorator';
import { userjwtInterface } from '../../jwt/interface/jwt.interface';
import { AttachPaymentMethodDto, SubscribeDto } from '../../stripe/dto/stripe.dto';

@ApiBearerAuth('jwt')
@ApiTags('Stripe')
@Controller('stripe')
@UseGuards(userjwtGuard)
export class userController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('attach-payment-method')
  @ApiOperation({ summary: 'Attach a payment method to a Stripe customer' })
  @ApiResponse({ status: 200, description: 'Payment method attached successfully' })
  async attachPaymentMethod(
    @User() user: userjwtInterface,
    @Body() attachDto: AttachPaymentMethodDto,
  ) {
    return this.stripeService.attachPaymentMethod(user.id, attachDto);
  }

  @Get('customer')
  @ApiOperation({ summary: 'Retrieve a Stripe customer' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  async getStripeCustomer(@User() user: userjwtInterface) {
    return this.stripeService.getStripeCustomer(user.id);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Create a subscription for the user' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async createSubscription(
    @User() user: userjwtInterface,
    @Body() subscribeDto: SubscribeDto,
  ) {
    return this.stripeService.createSubscription(user.id, subscribeDto);
  }

  @Get('subscription-status')
  @ApiOperation({ summary: 'Get the subscription status of the user' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved' })
  async getSubscriptionStatus(@User() user: userjwtInterface) {
    return this.stripeService.getSubscriptionStatus(user.id);
  }

  @Post('cancel-subscription')
  @ApiOperation({ summary: 'Cancel the user’s subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled' })
  async cancelSubscription(@User() user: userjwtInterface) {
    return this.stripeService.cancelSubscription(user.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async stripeWebhook(@Req() req: Request) {
    await this.stripeService.handleStripeWebhook(req);
  }
}
