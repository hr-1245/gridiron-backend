import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { adminauthEntity } from "src/modules/admin/entity/admin.entity";
import { HttpException, HttpStatus, NotFoundException } from "@nestjs/common";
import { loginDto } from "../dto/login.dto";
import { adminjwtService } from "src/modules/jwt/services/admin-jwt.service";
import { comparePassword } from "src/types/enums/bcrypt";

export class adminauthService {
  constructor(
    @InjectRepository(adminauthEntity)
    private repo: Repository<adminauthEntity>,
    private jwtService: adminjwtService
  ) { }

     //======================================FIND THE ADMIN EMAIL=========================================================

  find(email: string) {
    return this.repo.find({ where: { email } });
  }
 
      //======================================LOGIN LOGIC=========================================================

  async login(data: loginDto) {
    try {
      const [admin] = await this.find(data.email);
      if (!admin) {
        throw new NotFoundException('User not Found')
      }
      const isPasswordMatched = comparePassword(data.password, admin.password)
      if (!isPasswordMatched) {
        throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED)
      }
      const { password, ...adminwithoutPassword } = admin

      const accessToken = this.jwtService.generateAuthToken({
        email: admin.email,
        id: admin.id
      })
      return {
        message: 'User Logged In Successfully',
        result: adminwithoutPassword,
        accessToken
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}


