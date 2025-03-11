import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { playerjwtInterface } from "../interface/jwt.interface";


@Injectable()
export class playerjwtService {
  constructor(private jwtService: JwtService,
    private configService: ConfigService
  ) { }

  generateAuthToken(payload: playerjwtInterface) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('PLAYER_SECRET_KEY'),
      expiresIn: Number(this.configService.get('EXPIRES_IN')),
    });
  }

  decodeAuthToken(token: string) {
    return this.jwtService.decode(token);
  }
}
