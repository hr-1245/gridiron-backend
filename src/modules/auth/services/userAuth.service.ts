import { Injectable, HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { loginDto } from '../dto/login.dto';
import { signupDto } from '../dto/signup.dto';
import { userEntity } from 'src/modules/user/entity/userEntity';
import { otpService } from 'src/modules/otp/otp.service';
import { userjwtService } from 'src/modules/jwt/services/player-jwt.service';
import { OTP_REASON_ENUM } from 'src/types/enums/otp';
import { comparePassword, hashPassword } from 'src/types/enums/bcrypt';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class userAuthService {
  constructor(
    @InjectRepository(userEntity)
    private readonly repo: Repository<userEntity>,
    private readonly jwtService: userjwtService,
    private readonly otpService: otpService,
  ) { }

  // ===================================== REGISTER USER LOGIC =====================================
  async registeruser(data: signupDto) {
    try {
      const result = await this.repo.find({ where: { email: data.email } });
      if (result.length) {
        throw new BadRequestException('Email Already in use');
      }

      const hashedPassword = hashPassword(data.password);
      const user = this.repo.create({ ...data, password: hashedPassword });

      // Save user
      await this.repo.save(user);

      await this.otpService.generateOtpCode({
        email: user.email,
        reason: OTP_REASON_ENUM.VERIFY_EMAIL,
      });

      const { password, ...userWithoutPassword } = user;
      return {
        status: 'success',
        message: 'User Registered. Please check your email for verification code.',
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new HttpException(
        { status: 'error', message: 'User registration failed', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===================================== LOGIN USER LOGIC =====================================
  async login(data: loginDto) {
    try {
      const [user] = await this.repo.find({ where: { email: data.email } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordMatched = comparePassword(data.password, user.password);
      if (!isPasswordMatched) {
        throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
      }

      if (!user.isVerified) {
        const otpRecord = await this.otpService.findByEmail(data.email);

        if (!otpRecord || otpRecord.is_used || otpRecord.is_expired || otpRecord.expires_at < new Date()) {
          await this.otpService.generateOtpCode({
            email: user.email,
            reason: OTP_REASON_ENUM.VERIFY_EMAIL,
          });

          return {
            status: 'error',
            message: 'Your email verification OTP has expired or has already been used. Please check your inbox for a new verification code.',
            otpSent: true,
          };
        }

        return {
          status: 'error',
          message: 'Your email is not verified yet. Please check your inbox for the verification code.',
          otpSent: false,
        };
      }

      // If the user is already verified, proceed with the login
      const { password, ...userWithoutPassword } = user;
      const accessToken = this.jwtService.generateAuthToken({
        email: user.email,
        id: user.id,
        role: user.role,
      });

      return {
        status: 'success',
        message: 'User logged in successfully',
        user: userWithoutPassword,
        accessToken,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        { status: 'error', message: 'Login failed', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }




  // ===================================== VERIFY EMAIL LOGIC =====================================
  async verifyEmail(otp: number): Promise<any> {
    try {
      // Find the OTP record by the OTP code
      const otpRecord = await this.otpService.findByOtp(otp);

      if (!otpRecord) {
        throw new BadRequestException('Invalid OTP');
      }

      // Fetch the user associated with this OTP
      const user = await this.repo.findOne({ where: { email: otpRecord.email } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if the OTP is expired or used
      if (otpRecord.is_used || otpRecord.is_expired || otpRecord.expires_at < new Date()) {
        throw new BadRequestException('OTP is expired or already used');
      }

      // Check if the user is already verified
      if (user.isVerified) {
        throw new BadRequestException('Your email is already verified');
      }

      // OTP verified, mark user as verified
      user.isVerified = true;
      await this.repo.save(user);

      // Generate the JWT token for the user
      const accessToken = this.jwtService.generateAuthToken({
        email: user.email,
        id: user.id,
        role: user.role,
      });

      return {
        status: 'success',
        message: 'Email verified successfully',
        accessToken,
      };
    } catch (error) {
      // Handle specific exceptions
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // Handle unknown errors
      throw new HttpException(
        { status: 'error', message: 'Email verification failed', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  // ===================================== FORGOT PASSWORD LOGIC =====================================
  async forgotPassword(email: string) {
    try {
      const [user] = await this.repo.find({ where: { email } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.otpService.generateOtpCode({
        email: user.email,
        reason: OTP_REASON_ENUM.RESET_PASSWORD,
      });

      return {
        status: 'success',
        message: 'Password reset code sent to your email',
      };
    } catch (error) {
      throw new HttpException(
        { status: 'error', message: 'Failed to process forgot password request', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===================================== RESET PASSWORD LOGIC =====================================
  async verifyOTPAndResetPassword(email: string, otp: number, newPassword: string) {
    try {
      const otpRecord = await this.otpService.findByOtp(otp);
      if (!otpRecord) {
        throw new BadRequestException('Invalid OTP');
      }

      if (otpRecord.email !== email.toLowerCase()) {
        throw new BadRequestException('OTP does not match email');
      }

      if (otpRecord.is_expired || otpRecord.is_used || otpRecord.expires_at < new Date()) {
        throw new BadRequestException('OTP has expired or already been used');
      }

      const [user] = await this.repo.find({ where: { email: email.toLowerCase() } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.password = hashPassword(newPassword);
      otpRecord.is_used = true;

      await this.repo.manager.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(user);
        await transactionalEntityManager.save(otpRecord);
      });

      return {
        status: 'success',
        message: 'Password reset successful',
      };
    } catch (error) {
      throw new HttpException(
        { status: 'error', message: 'Failed to reset password', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
