import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody
} from '@nestjs/swagger';
import { StripeService } from '../stripe/stripe.service';
import { DiscountConfigDto } from '../stripe/dto/stripe.dto';

@ApiTags('Admin Stripe Management')
@Controller('admin/stripe')
export class adminController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('discount')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update discount configuration' })
  @ApiResponse({
    status: 201,
    description: 'Discount configuration created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid discount data' })
  @ApiBody({ type: DiscountConfigDto })
  async setDiscountConfiguration(
    @Body() discountConfigDto: DiscountConfigDto
  ) {
    return this.stripeService.setDiscountConfiguration(
      discountConfigDto
    );
  }

  @Get('discount/current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current active discount configuration' })
  @ApiResponse({
    status: 200,
    description: 'Current active discount configuration',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentDiscountConfiguration() {
    return this.stripeService.getCurrentDiscountConfiguration();
  }

  @Get('discount/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all discount configurations' })
  @ApiResponse({
    status: 200,
    description: 'List of all discount configurations',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllDiscountConfigurations() {
    return this.stripeService.getAllDiscountConfigurations();
  }
}