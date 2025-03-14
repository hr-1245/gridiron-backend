import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService } from '../stripe/stripe.service';
import { CreateSubscriptionDto } from '../stripe/dto/create-subscription.dto';
import { User } from 'src/utils/user.decorator';
import { userjwtInterface } from '../jwt/interface/jwt.interface';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';

@ApiTags('Stripe')
@ApiBearerAuth('jwt')
@Controller('stripe')
@UseGuards(userjwtGuard)
export class userController {
  constructor(private readonly stripeService: StripeService) { }

  // ✅ 1️⃣ Trial Plan - One-time charge of $0.99
  @Post('trial')
  @ApiOperation({ summary: 'Start a trial for $0.99' })
  @ApiResponse({ status: 201, description: 'Trial activated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createTrial(@User() user: userjwtInterface, @Body() dto: CreateSubscriptionDto) {
      return this.stripeService.createTrialPlan(user.id);
  }

  // ✅ 2️⃣ Regular Subscription - Recurring charge
  @Post('subscription')
  @ApiOperation({ summary: 'Create a recurring subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createSubscription(@User() user: userjwtInterface, @Body() dto: CreateSubscriptionDto) {
    return this.stripeService.createSubscription(user.id, dto);
  }

  // ✅ 3️⃣ Get User's Subscription Status
  @Get('status')
  @ApiOperation({ summary: 'Get user subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getSubscriptionStatus(@User() user: userjwtInterface) {
    return this.stripeService.subscriptionStatus(user.id);
  }
}
