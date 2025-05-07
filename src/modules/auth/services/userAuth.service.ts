import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { userEntity } from 'src/modules/user/entity/userEntity';
import { userjwtService } from 'src/modules/jwt/services/user-jwt.service';
import { otpService } from 'src/modules/otp/otp.service';
import { OTP_REASON_ENUM } from 'src/types/enums/otp';
import { comparePassword, hashPassword } from 'src/types/enums/bcrypt';
import { rolesEnum } from 'src/types/enums/roles';
import { loginDto } from '../dto/login.dto';
import { signupDto } from '../dto/signup.dto';

@Injectable()
export class userAuthService {
  constructor(
    @InjectRepository(userEntity)
    private readonly repo: Repository<userEntity>,
    private readonly jwtService: userjwtService,
    private readonly otpService: otpService,
  ) { }

  // STEP 1: Send OTP to Email
  async initiateSignup(email: string) {
    const existing = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    if (existing) throw new BadRequestException('Email already registered');

    await this.otpService.generateOtpCode({
      email: email.toLowerCase(),
      reason: OTP_REASON_ENUM.VERIFY_EMAIL,
    });

    return {
      message: 'Verification code sent to email',
      email: email.toLowerCase()
    };
  }

  async completeRegistration(data: signupDto) {
    const existing = await this.repo.findOne({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new BadRequestException('Email already registered');

    const otpRecord = await this.otpService.findByOtp(data.otp);
    if (!otpRecord || otpRecord.email !== data.email.toLowerCase()) {
      throw new BadRequestException('Invalid verification code');
    }

    if (otpRecord.is_expired || otpRecord.is_used || otpRecord.expires_at < new Date()) {
      throw new BadRequestException('Verification code expired or used');
    }

    // Create and save user
    const user = this.repo.create({
      email: data.email.toLowerCase(),
      password: hashPassword(data.password),
      fullName: data.fullName,
      role: rolesEnum.USER,
      isVerified: true,
    });

    otpRecord.is_used = true;

    await this.repo.manager.transaction(async manager => {
      await manager.save(user);
      await manager.save(otpRecord);
    });

    const accessToken = this.jwtService.generateAuthToken({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;
    return {
      message: 'Registration successful',
      user: userWithoutPassword,
      accessToken
    };
  }

  // LOGIN
  async login(data: loginDto) {
    const email = data.email.toLowerCase();
    const user = await this.repo.findOne({ where: { email } });

    if (!user) throw new NotFoundException('User not found');

    if (!comparePassword(data.password, user.password)) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (!user.isVerified) {
      throw new BadRequestException('Account not verified');
    }

    const token = this.jwtService.generateAuthToken({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;
    return { message: 'Login successful', user: userWithoutPassword, accessToken: token };
  }

  // FORGOT PASSWORD
  async forgotPassword(email: string) {
    const user = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');

    await this.otpService.generateOtpCode({
      email: user.email,
      reason: OTP_REASON_ENUM.RESET_PASSWORD,
    });

    return { message: 'Reset code sent to email' };
  }

  // RESET PASSWORD
  async verifyOTPAndResetPassword(email: string, otp: number, newPassword: string) {
    const otpRecord = await this.otpService.findByOtp(otp);
    if (!otpRecord || otpRecord.email !== email.toLowerCase()) {
      throw new BadRequestException('Invalid verification code');
    }

    if (otpRecord.is_expired || otpRecord.is_used || otpRecord.expires_at < new Date()) {
      throw new BadRequestException('Verification code expired or used');
    }

    const user = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');

    user.password = hashPassword(newPassword);
    otpRecord.is_used = true;

    await this.repo.manager.transaction(async manager => {
      await manager.save(user);
      await manager.save(otpRecord);
    });

    return { message: 'Password reset successful' };
  }
}
