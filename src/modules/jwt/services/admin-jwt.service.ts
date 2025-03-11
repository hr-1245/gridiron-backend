import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { adminjwtInterface } from '../interface/jwt.interface';

@Injectable()
export class adminjwtService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  generateAuthToken(payload: adminjwtInterface) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('ADMIN_SECRET_KEY'),
      expiresIn: Number(this.configService.get('EXPIRES_IN')),
    });
  }

  decodeAuthToken(token: string) {
    return this.jwtService.decode(token);
  }
}
