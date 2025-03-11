import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { playerauthEntity } from "src/modules/player/entity/player.entity";
import { BadRequestException, HttpException, HttpStatus, NotFoundException } from "@nestjs/common";
import { comparePassword, hashPassword } from "src/utils/bcrypt";
import { signupDto } from "../dto/signup.dto";
import { playerjwtService } from "src/modules/jwt/services/player-jwt.service";
import { loginDto } from "../dto/login.dto";

export class playerAuthService {
  constructor(
    @InjectRepository(playerauthEntity)
    private repo: Repository<playerauthEntity>,
    private jwtService: playerjwtService
  ) { }

  async registerPlayer(data: signupDto) {
    try {
      const player = await this.find(data.email);
      if (player.length) {
        throw new BadRequestException('Email Already in use');
      }
      const hashedPassword = hashPassword(data.password);
      const user = await this.createplayerInstance(data, hashedPassword);

      const accessToken = this.jwtService.generateAuthToken({
        email: user.email,
        id: user.id,
      });

      const { password, ...playerWithoutPassword } = user

      return {
        message: 'Player Created',
        playerWithoutPassword,
        accessToken,
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

  async find(email: string) {
    try {
      return await this.repo.find({ where: { email } });
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  async login(data: loginDto) {
    try {
      const [admin] = await this.find(data.email);
      if (!admin) {
        throw new NotFoundException('Player not Found');
      }
      const isPasswordMatched = comparePassword(data.password, admin.password);
      if (!isPasswordMatched) {
        throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
      }

      const { password, ...playerWithoutPassword } = admin;

      const accessToken = this.jwtService.generateAuthToken({
        email: admin.email,
        id: admin.id,
      });

      return {
        message: 'Player Logged In Successfully',
        admin: playerWithoutPassword,
        accessToken,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}
