import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException, HttpException, HttpStatus, NotFoundException } from "@nestjs/common";
import { comparePassword, hashPassword } from "src/utils/bcrypt";
import { signupDto } from "../dto/signup.dto";
import { userjwtService } from "src/modules/jwt/services/player-jwt.service";
import { loginDto } from "../dto/login.dto";
import { userEntity } from "src/modules/user/entity/user.entity";

export class userAuthService {
  constructor(
    @InjectRepository(userEntity)
    private repo: Repository<userEntity>,
    private jwtService: userjwtService
  ) { }

  async registeruser(data: signupDto) {
    try {
      const result = await this.find(data.email);
      if (result.length) {
        throw new BadRequestException('Email Already in use');
      }
      const hashedPassword = hashPassword(data.password);
      const user = await this.createuserInstance(data, hashedPassword);

      const accessToken = this.jwtService.generateAuthToken({
        email: user.email,
        id: user.id,
      });

      const { password, ...userWithoutPassword } = user

      return {
        message: 'user Created',
        userWithoutPassword,
        accessToken,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

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

  async find(email: string) {
    try {
      return await this.repo.find({ where: { email } });
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

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
