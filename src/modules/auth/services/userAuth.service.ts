import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException, HttpException, HttpStatus, NotFoundException } from "@nestjs/common";
import { signupDto } from "../dto/signup.dto";
import { userjwtService } from "src/modules/jwt/services/player-jwt.service";
import { loginDto } from "../dto/login.dto";
import { userEntity } from "src/modules/user/entity/user.entity";
import { comparePassword, hashPassword } from "src/types/enums/bcrypt";
import Stripe from "stripe";
import { ConfigService } from "@nestjs/config";

export class userAuthService {
  stripe: Stripe;
  constructor(
    @InjectRepository(userEntity)
    private repo: Repository<userEntity>,
    private jwtService: userjwtService,
    private readonly configService: ConfigService
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
      const user = await this.createuserInstance(data, hashedPassword);

      // Create Stripe Customer
      const stripeCustomer = await this.stripe.customers.create({
        email: user.email
      });

      // Store Stripe Customer ID
      user.stripeCustomerId = stripeCustomer.id;
      await this.repo.save(user);

      const accessToken = this.jwtService.generateAuthToken({
        email: user.email,
        id: user.id,
      });

      const { password, ...userWithoutPassword } = user;

      return {
        message: 'User Created',
        user: userWithoutPassword,
        accessToken,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }


   //======================================CREATE USER INSTANCE LOGIC=========================================================

  async createuserInstance(data: signupDto, encryptedPassword: string) {
    try {
      const user = this.repo.create({
        ...data,
        email: data.email.toLowerCase(),
        password: encryptedPassword,
      });
      return await this.repo.save(user);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  
  //======================================FIND USER MY EMAIL=========================================================
 
  async find(email: string) {
    try {
      return await this.repo.find({ where: { email } });
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

      const { password, ...userWithoutPassword } = user;

      const accessToken = this.jwtService.generateAuthToken({
        email: user.email,
        id: user.id,
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
}