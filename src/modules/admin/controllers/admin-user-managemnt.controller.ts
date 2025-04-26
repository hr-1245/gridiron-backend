import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { adminService } from "../admin.service";
import { adminjwtGuard } from "src/providers/guards/admin.guard";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { subscriptionEnum } from "src/types/enums/subscription";

@ApiTags('Admin User Management')
@Controller('admin/user-management')
@ApiBearerAuth('jwt')
@UseGuards(adminjwtGuard

)
export class adminUserManagementController {
  constructor(private readonly adminSerivce: adminService) { }

  @Get('subscribed-users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all subscribed users (admin only)' })
  @ApiResponse({ status: 200, description: 'Subscribed users retrieved successfully' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'searchValue', required: false })
  @ApiQuery({ name: 'planType', required: false })
  async getAllSubscribedUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('searchValue') searchValue?: string,
    @Query('planType') planType?: subscriptionEnum
  ) {
    return this.adminSerivce.getAllSubscribedUsers(page, limit, searchValue, planType);
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users (including non-subscribers)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'searchValue', required: false })
  @ApiQuery({ name: 'isSubscribed', required: false, type: Boolean })
  async getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('searchValue') searchValue?: string,
  ) {
    return this.adminSerivce.getAllUsers(page, limit, searchValue);
  }



}

