import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { userAuthService } from "../services/userAuth.service";
import { signupDto } from "../dto/signup.dto";
import { loginDto } from "../dto/login.dto";


@ApiTags('auth/user')
@Controller('auth')
export class userauthController {
  constructor(private authService: userAuthService) { }

  @ApiOperation({ summary: 'Generated new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Something went wrong',
  })
  @Post('signup')
  async signup(@Body() body: signupDto) {
    return await this.authService.registeruser(body)
  }

  @ApiOperation({ summary: 'User Signin Route' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User logged In Successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already Logged In',
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