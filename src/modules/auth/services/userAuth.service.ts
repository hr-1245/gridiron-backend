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
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { discountConfigEntity, userPlanEntity } from 'src/modules/user/entity/userPlan.entity';
import { paymentStatus, subscriptionEnum } from 'src/types/enums/subscription';
@Injectable()
export class userAuthService {
  private stripe: Stripe;
  private readonly webhookSecret: string;
  constructor(
    @InjectRepository(userEntity)
    private readonly repo: Repository<userEntity>,

    @InjectRepository(userPlanEntity)
    private readonly userplanRepo: Repository<userPlanEntity>,

    @InjectRepository(discountConfigEntity)
    private readonly discountConfigRepo: Repository<discountConfigEntity>,

    private readonly jwtService: userjwtService,
    private readonly otpService: otpService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SIGN') || '';
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
  }

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
    const email = data.email.toLowerCase();

    const existing = await this.repo.findOne({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const otpRecord = await this.otpService.findByOtp(data.otp);
    if (!otpRecord || otpRecord.email !== email) {
      throw new BadRequestException('Invalid verification code');
    }

    if (otpRecord.is_expired || otpRecord.is_used || otpRecord.expires_at < new Date()) {
      throw new BadRequestException('Verification code expired or used');
    }

    // Create user
    const user = this.repo.create({
      email,
      password: hashPassword(data.password),
      fullName: data.fullName,
      role: rolesEnum.USER,
      isVerified: true,
    });

    // Create a Stripe customer
    const stripeCustomer = await this.stripe.customers.create({ email });

    // Assign the Stripe Customer ID to the user
    user.stripeCustomerId = stripeCustomer.id;



    const userPlan = this.userplanRepo.create({
      user,
      planType: subscriptionEnum.BASIC,
      subscriptionStatus: paymentStatus.NOT_REQUIRED,
    });

    otpRecord.is_used = true;

    await this.repo.manager.transaction(async manager => {
      await manager.save(user);
      await manager.save(userPlan);
      await manager.save(otpRecord);
    });

    // Fetch the user with the plan
    const userWithPlan = await this.repo.findOne({
      where: { id: user.id },
      relations: { subscription: true },
    });

    let discount: discountConfigEntity | null = null;
    if (userWithPlan?.subscription?.appliedDiscountId) {
      discount = await this.discountConfigRepo.findOne({
        where: { id: userWithPlan.subscription.appliedDiscountId },
      });
    }

    // Generate auth token
    const accessToken = this.jwtService.generateAuthToken({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    if (!userWithPlan) {
      throw new NotFoundException('User plan not found');
    }
    const { password, ...userWithoutPassword } = userWithPlan;

    return {
      message: 'Registration successful',
      user: {
        ...userWithoutPassword,
        subscription: {
          ...userWithPlan.subscription,
          discount,
        },
      },
      accessToken,
    };
  }



  async login(data: loginDto) {
    const email = data.email.toLowerCase();
    const user = await this.repo.findOne({
      where: { email },
      relations: {
        subscription: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!comparePassword(data.password, user.password)) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (!user.isVerified) {
      throw new BadRequestException('Account not verified');
    }

    let discount: discountConfigEntity | null = null;
    if (user.subscription?.appliedDiscountId) {
      discount = await this.discountConfigRepo.findOne({
        where: { id: user.subscription.appliedDiscountId },
      });
    }

    const token = this.jwtService.generateAuthToken({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        subscription: {
          ...user.subscription,
          discount,
        },
      },
      accessToken: token,
    };
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
