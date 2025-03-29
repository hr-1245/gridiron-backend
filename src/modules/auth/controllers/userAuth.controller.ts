import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from "@nestjs/swagger";
import { userAuthService } from "../services/userAuth.service";
import { signupDto } from "../dto/signup.dto";
import { loginDto } from "../dto/login.dto";
import { ResendVerificationDto, VerifyEmailDto } from "../dto/verifyemai.dto";

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
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiBody({ type: VerifyEmailDto, description: 'Email and OTP verification data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP',
    schema: {
      properties: {
        message: { type: 'string', example: 'OTP code has expired' },
        status: { type: 'number', example: 400 }
      }
    }
  })

 
 //--------------------------VERIFY EMAIL ----------------
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiBody({ type: VerifyEmailDto, description: 'OTP verification code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP'
  })
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return await this.authService.verifyEmail(body.otp);
  }

//--------------------RESEND VERIFY EMAIL ------------
  @Post('resend-verification')
  async resendVerification(@Body() body: ResendVerificationDto) {
    return await this.authService.resendVerificationOtp(body.email);
  }
}