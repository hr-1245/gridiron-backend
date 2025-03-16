import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { comparePassword, hashPassword } from "src/types/enums/bcrypt";
import { OTP_REASON_ENUM } from "src/types/enums/otp";
import { loginDto } from "../dto/login.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { userEntity } from "src/modules/user/entity/user.entity";
import { userjwtService } from "src/modules/jwt/services/player-jwt.service";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { signupDto } from "../dto/signup.dto";
import { otpService } from "src/modules/otp/otp.service";

@Injectable()
export class userAuthService {
  stripe: Stripe;

  constructor(
    @InjectRepository(userEntity)
    private repo: Repository<userEntity>,

    private jwtService: userjwtService,

    private readonly configService: ConfigService,

    private readonly otpService: otpService
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2025-02-24.acacia' },
    );
  }

  //======================================REGISTER USER LOGIC=========================================================
  async registeruser(data: signupDto) {
    try {
      const result = await this.find(data.email);
      if (result.length) {
        throw new BadRequestException('Email Already in use');
      }
      const hashedPassword = hashPassword(data.password);
      const user = await this.createplayerInstance(data, hashedPassword);

      const stripeCustomer = await this.stripe.customers.create({
        email: user.email
      });

      user.stripeCustomerId = stripeCustomer.id;
      await this.repo.save(user);

      await this.otpService.generateOtpCode({
        email: user.email,
        reason: OTP_REASON_ENUM.VERIFY_EMAIL
      });

      const { password, ...userWithoutPassword } = user;

      return {
        message: 'User Created. Please check your email for verification code.',
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  async createplayerInstance(data: signupDto, encryptedPassword: string) {
    try {
      const player = this.repo.create({
        ...data,
        email: data.email.toLowerCase(),
        password: encryptedPassword,
      });
      return await this.repo.save(player);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
  //======================================LOGIN USER LOGIC=========================================================

  async login(data: loginDto) {
    try {
      const [user] = await this.find(data.email);
      if (!user) {
        throw new NotFoundException('User not Found');
      }
      const isPasswordMatched = comparePassword(data.password, user.password);
      if (!isPasswordMatched) {
        throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
      }

      if (!user.isVerified) {
        throw new HttpException('Please verify your email before logging in', HttpStatus.UNAUTHORIZED);
      }

      const { password, ...userWithoutPassword } = user;

      const accessToken = this.jwtService.generateAuthToken({
        email: user.email,
        id: user.id,
        role: user.role
      });

      return {
        message: 'User Logged In Successfully',
        user: userWithoutPassword,
        accessToken,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  find(email: string) {
    return this.repo.find({ where: { email } });
  }
  //======================================VERIFY EMAIL LOGIC=========================================================
  async verifyEmail(otp: number) {
    try {

      const otp_record = await this.otpService.findByOtp(otp);

      if (!otp_record) {
        throw new NotFoundException('Invalid verification code');
      }

      const result = await this.otpService.verifyOtpCode({
        otp,
        email: otp_record.email
      });

      if (result.status === HttpStatus.OK) {

        const [user] = await this.find(otp_record.email);
        if (!user) {
          throw new NotFoundException('User not found');
        }

        user.isVerified = true;
        await this.repo.save(user);

        return {
          message: 'Email verified successfully',
          status: HttpStatus.OK
        };
      }

      return result;
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
  //======================================RESEND OTP LOGIC=========================================================
  async resendVerificationOtp(email: string) {
    try {
      const [user] = await this.find(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isVerified) {
        return {
          message: 'Email is already verified',
          status: HttpStatus.OK
        };
      }

      await this.otpService.generateOtpCode({
        email,
        reason: OTP_REASON_ENUM.VERIFY_EMAIL
      });

      return {
        message: 'Verification code sent successfully',
        status: HttpStatus.OK
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}