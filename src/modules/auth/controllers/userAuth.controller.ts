import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from "@nestjs/swagger";
import { userAuthService } from "../services/userAuth.service";
import { signupDto } from "../dto/signup.dto";
import { loginDto } from "../dto/login.dto";
import { VerifyEmailDto } from "../dto/verifyemai.dto";
import { ForgetPasswordDTO } from "../dto/forgot-password.dto";
import { ResetPasswordDTO } from "../dto/reset-password.dto";

@ApiTags('USER')
@Controller('auth')
export class userauthController {
  constructor(private authService: userAuthService) { }

  //======================================CREATE NEW USER API=========================================================
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: signupDto, description: 'User registration data' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already exists',
    schema: {
      properties: {
        message: { type: 'string', example: 'Email Already in use' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Something went wrong',
    schema: {
      properties: {
        message: { type: 'string', example: 'Internal server error' },
        error: { type: 'string', example: 'Internal Server Error' },
        statusCode: { type: 'number', example: 500 }
      }
    }
  })
  @Post('signup')
  async signup(@Body() body: signupDto) {
    return await this.authService.registeruser(body);
  }

  //======================================SIGN IN THE USER API=========================================================
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: loginDto, description: 'User login credentials' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or unverified email',
    schema: {
      properties: {
        message: { type: 'string', example: 'Invalid Credentials' },
        error: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 }
      }
    }
  })
  @Post('signin')
  async login(@Body() body: loginDto) {
    return await this.authService.login(body);
  }


  //======================================VERIFY EMAIL API=========================================================
  @ApiOperation({ summary: 'Verify Email Route' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @Post('verify/email')
  async verifyEmail(@Body() verifyEmailDTO: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(verifyEmailDTO.otp)
    return result;
  }


  @ApiOperation({ summary: 'Forgot Password Route' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP sent to email',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @Post('forgot/password')
  async forgotPassword(@Body() forgetPasswordDTO: ForgetPasswordDTO) {
    await this.authService.forgotPassword(forgetPasswordDTO.email);
    return { message: 'OTP sent to email' };
  }

  @ApiOperation({ summary: 'Reset Password Route' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @Post('reset/password')
  async resetPassword(@Body() resetPasswordDTO: ResetPasswordDTO) {
    await this.authService.verifyOTPAndResetPassword(
      resetPasswordDTO.email,
      resetPasswordDTO.otp,
      resetPasswordDTO.password,
    );
    return { message: 'Password reset successful' };
  }
}