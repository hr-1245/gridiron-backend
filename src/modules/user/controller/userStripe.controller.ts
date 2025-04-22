
import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';
import { User } from 'src/utils/user.decorator';
import { AttachPaymentMethodDto, SubscribeDto } from 'src/modules/stripe/dto/stripe.dto';
import { StripeService } from 'src/modules/stripe/stripe.service';
import { userjwtInterface } from 'src/modules/jwt/interface/jwt.interface';

@ApiBearerAuth('jwt')
@ApiTags('Stripe')
@Controller('stripe')
@UseGuards(userjwtGuard)
export class userController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('attach-payment-method')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach a payment method to a Stripe customer' })
  @ApiBody({
    type: AttachPaymentMethodDto,
    description: 'Payment method information'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method attached successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Payment method attached successfully' },
        paymentMethodId: { type: 'string', example: 'pm_1Nd9XtEFVW7EhkuvVYQkUzPB' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Missing customer ID or payment method' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Failed to attach payment method' })
  async attachPaymentMethod(
    @User() user: userjwtInterface,
    @Body() attachDto: AttachPaymentMethodDto,
  ) {
    return this.stripeService.attachPaymentMethod(user.id, attachDto);
  }

  @Get('customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a Stripe customer' })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Customer retrieved successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            stripeCustomerId: { type: 'string', example: 'cus_O3XUbXFkZQIQBf' },
            paymentMethodId: { type: 'string', example: 'pm_1Nd9XtEFVW7EhkuvVYQkUzPB' }
          }
        },
        customer: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cus_O3XUbXFkZQIQBf' },
            email: { type: 'string', example: 'user@example.com' },
            invoiceSettings: { type: 'object' },
            defaultPaymentMethod: { type: 'object' },
            metadata: { type: 'object' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User does not have a Stripe customer ID' })
  @ApiResponse({ status: 500, description: 'Failed to retrieve Stripe customer' })
  async getStripeCustomer(@User() user: userjwtInterface) {
    return this.stripeService.getStripeCustomer(user.id);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a subscription with optional automatic discount' })
  @ApiBody({
    type: SubscribeDto,
    description: 'Subscription details'
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Subscribed to Regular Plan successfully' },
        subscriptionId: { type: 'string', example: 'sub_1NdB2rEFVW7EhkuvQZqUXRQs' },
        status: { type: 'string', example: 'active' },
        discount: {
          type: 'object',
          properties: {
            applied: { type: 'boolean', example: true },
            percentage: { type: 'number', example: 15 },
            name: { type: 'string', example: 'Summer Special' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - No payment method attached' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User already has an active subscription' })
  @ApiResponse({ status: 500, description: 'Failed to create subscription' })
  async createSubscription(
    @User() user: userjwtInterface,
    @Body() subscribeDto: SubscribeDto,
  ) {
    return this.stripeService.createSubscription(user.id, subscribeDto);
  }

  @Get('subscription-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the subscription status of the user' })
  @ApiResponse({
    status: 200,
    description: 'Subscription status retrieved',
    schema: {
      type: 'object',
      properties: {
        isSubscribed: { type: 'boolean', example: true },
        status: { type: 'string', example: 'active' },
        planType: { type: 'string', example: 'REGULAR' },
        currentPeriodEnd: { type: 'number', example: 1683914625 },
        cancelAtPeriodEnd: { type: 'boolean', example: false },
        appliedDiscount: {
          type: 'object',
          properties: {
            percentage: { type: 'number', example: 15 },
            name: { type: 'string', example: 'Summer Special' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Failed to get subscription status' })
  async getSubscriptionStatus(@User() user: userjwtInterface) {
    return this.stripeService.getSubscriptionStatus(user.id);
  }

  @Post('cancel-subscription')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel the user\'s subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Subscription will be canceled at the end of the billing period' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  @ApiResponse({ status: 500, description: 'Failed to cancel subscription' })
  async cancelSubscription(@User() user: userjwtInterface) {
    return this.stripeService.cancelSubscription(user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint to handle events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook received',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Webhook received' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Webhook secret or signature missing or verification failed' })
  async stripeWebhook(@Req() req: Request) {
    return await this.stripeService.handleStripeWebhook(req);
  }
}