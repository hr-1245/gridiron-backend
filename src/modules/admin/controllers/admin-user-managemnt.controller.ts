import { Controller, Get, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { adminjwtGuard } from "src/providers/guards/admin.guard";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { analyticsDto } from "../dto/analytics.dto";
import { getAnalyticsService } from "../getAnalytics.service";

@ApiTags('Admin User Management')
@Controller('admin/user-management')
@ApiBearerAuth('jwt')
@UseGuards(adminjwtGuard

)
export class adminUserManagementController {
  constructor(private readonly getAnalytics: getAnalyticsService) { }

  @ApiOperation({ summary: 'Get Analytics For Dashboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful response',
    type: analyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Something went wrong',
  })
  @Get('get-analytics')
  async getDropdown() {
    return await this.getAnalytics.execute();
  }


}

