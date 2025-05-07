import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { userAuthService } from '../services/userAuth.service';
import { signupDto } from '../dto/signup.dto';
import { loginDto } from '../dto/login.dto';
import { ForgetPasswordDTO } from '../dto/forgot-password.dto';
import { ResetPasswordDTO } from '../dto/reset-password.dto';
import { InitiateSignupDto } from '../dto/initiate-setup.dto';

@ApiTags('USER')
@Controller('auth')
export class userauthController {
  constructor(private authService: userAuthService) { }

  // ============================= STEP 1: Send OTP to email =============================
  @ApiOperation({ summary: 'Initiate signup by sending OTP to email' })
  @ApiBody({ type: InitiateSignupDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'OTP sent to email' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Email already registered' })
  @Post('signup/initiate')
  async initiateSignup(@Body() body: InitiateSignupDto) {
    return await this.authService.initiateSignup(body.email);
  }

  // ============================= STEP 2: Register new user =============================
  @ApiOperation({ summary: 'Register a new user using OTP' })
  @ApiBody({ type: signupDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid OTP or email already exists' })
  @Post('signup')
  async signup(@Body() body: signupDto) {
    return await this.authService.completeRegistration(body);
  }

  // ============================= LOGIN =============================
  @ApiOperation({ summary: 'Login existing user' })
  @ApiBody({ type: loginDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials or unverified account' })
  @Post('signin')
  async login(@Body() body: loginDto) {
    return await this.authService.login(body);
  }

  // ============================= FORGOT PASSWORD =============================
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @ApiBody({ type: ForgetPasswordDTO })
  @ApiResponse({ status: HttpStatus.OK, description: 'OTP sent to email' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @Post('forgot/password')
  async forgotPassword(@Body() body: ForgetPasswordDTO) {
    return await this.authService.forgotPassword(body.email);
  }

  // ============================= RESET PASSWORD =============================
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiBody({ type: ResetPasswordDTO })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successful' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @Post('reset/password')
  async resetPassword(@Body() body: ResetPasswordDTO) {
    return await this.authService.verifyOTPAndResetPassword(
      body.email,
      body.otp,
      body.password,
    );
  }
}
