import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { playerAuthService } from "../services/playerAuth.service";
import { signupDto } from "../dto/signup.dto";
import { loginDto } from "../dto/login.dto";


@ApiTags('player/auth')
@Controller('auth/player')
export class playerauthController {
  constructor(private authService: playerAuthService) { }

  @ApiOperation({ summary: 'Player new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Player created successfully',
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
    return await this.authService.registerPlayer(body)
  }

  @ApiOperation({ summary: 'Player Signin Route' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Player logged In Successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Player already Logged In',
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