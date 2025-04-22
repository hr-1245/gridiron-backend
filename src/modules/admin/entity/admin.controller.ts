import { Controller, Delete, HttpCode, HttpStatus, UseGuards, Post, Body, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { userjwtInterface } from 'src/modules/jwt/interface/jwt.interface';
import { StripeService } from 'src/modules/stripe/stripe.service';
import { adminjwtGuard } from 'src/providers/guards/admin.guard';
import { User } from 'src/utils/user.decorator';

@ApiBearerAuth('jwt-admin')
@UseGuards(adminjwtGuard)
@ApiTags('Admin')
@Controller('admin')
export class adminController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly stripeService: StripeService
  ) { }

  @Delete('delete-all-media')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all media files from Cloudinary' })
  @ApiResponse({ status: 200, description: 'All media files deleted successfully' })
  @ApiResponse({ status: 500, description: 'Failed to delete all files' })
  async deleteAllMedia(): Promise<{ message: string }> {
    await this.cloudinaryService.deleteAllFiles();
    return { message: 'All media files deleted successfully' };
  }

  /**
   * Discount Management Endpoints
   */
  @Post('discounts/configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configure subscription discount' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        percentage: {
          type: 'number',
          description: 'Discount percentage (0-100)',
          example: 15
        },
        name: {
          type: 'string',
          description: 'Name of the discount',
          example: 'Summer Special'
        },
        isActive: {
          type: 'boolean',
          description: 'Whether this discount is currently active',
          example: true
        }
      },
      required: ['percentage', 'isActive']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Discount configured successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        percentage: { type: 'number', example: 15 },
        name: { type: 'string', example: 'Summer Special' },
        isActive: { type: 'boolean', example: true },
        createdBy: { type: 'number', example: 42 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid discount percentage or unauthorized access' })
  async configureDiscount(
    @User() admin: userjwtInterface,
    @Body() discountData: { percentage: number; name?: string; isActive: boolean },
  ) {
    return await this.stripeService.setDiscountConfiguration(admin.id, discountData);
  }

  @Get('discounts/current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current active discount configuration' })
  @ApiResponse({
    status: 200,
    description: 'Current discount configuration',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        percentage: { type: 'number', example: 15 },
        name: { type: 'string', example: 'Summer Special' },
        isActive: { type: 'boolean', example: true },
        createdBy: { type: 'number', example: 42 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getCurrentDiscount() {
    return await this.stripeService.getCurrentDiscountConfiguration();
  }

  @Get('discounts/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all discount configurations' })
  @ApiResponse({
    status: 200,
    description: 'List of all discount configurations',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          percentage: { type: 'number', example: 15 },
          name: { type: 'string', example: 'Summer Special' },
          isActive: { type: 'boolean', example: true },
          createdBy: { type: 'number', example: 42 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  async getAllDiscounts() {
    return await this.stripeService.getAllDiscountConfigurations();
  }
}