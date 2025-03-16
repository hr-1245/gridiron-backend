import { Body, Controller, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { adminauthService } from "../services/adminAuth.service";
import { loginDto } from "../dto/login.dto";


@Controller()
@ApiTags('auth/admin')
@Controller('auth')
export class adminauthController {

  constructor(private authService: adminauthService) {
  }

  //======================================SIGN IN ADMIN API=========================================================
  @ApiOperation({ summary: 'Admin Signin Route' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin logged In Successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Admin already Logged In',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Something went wrong',
  })
  @Post('login')
  async login(@Body() body: loginDto) {
    return await this.authService.login(body)
  }
}
