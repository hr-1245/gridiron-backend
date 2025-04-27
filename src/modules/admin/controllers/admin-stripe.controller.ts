import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { StripeService } from '../../stripe/stripe.service';
import { DiscountConfigDto } from '../../stripe/dto/stripe.dto';
import { adminjwtGuard } from 'src/providers/guards/admin.guard';
import { adminJwtInterface } from '../../jwt/interface/jwt.interface';
import { User } from 'src/utils/user.decorator';
import { subscriptionEnum } from 'src/types/enums/subscription';

@ApiTags('Admin Stripe Management')
@Controller('admin/stripe')
@ApiBearerAuth('jwt')
@UseGuards(adminjwtGuard)
export class adminController {
  constructor(private readonly stripeService: StripeService,
  ) { }

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
    @Body() discountConfigDto: DiscountConfigDto,
    @User() admin: adminJwtInterface
  ) {
    return this.stripeService.setDiscountConfiguration(
      admin.id, discountConfigDto
    );
  }

  @Delete('discount/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove active discount configuration' })
  @ApiResponse({ status: 200, description: 'Discount removed successfully' })
  @ApiResponse({ status: 404, description: 'Admin or active discount not found' })
  async removeDiscount(@User() admin: adminJwtInterface) {
    return this.stripeService.removeActiveDiscountConfiguration(admin.id);
  }


  @Get('discount/current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current active discount configuration' })
  @ApiResponse({
    status: 200,
    description: 'Current active discount configuration',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentDiscountConfiguration(
    @User() admin: adminJwtInterface

  ) {
    return this.stripeService.getCurrentDiscountConfiguration(admin.id);
  }

  @Get('discount/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all discount configurations' })
  @ApiResponse({
    status: 200,
    description: 'List of all discount configurations',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllDiscountConfigurations(
    @User() admin: adminJwtInterface

  ) {
    return this.stripeService.getAllDiscountConfigurations(admin.id);
  }



}