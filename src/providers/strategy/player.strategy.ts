import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { playerjwtInterface } from 'src/modules/jwt/interface/jwt.interface';


@Injectable()
export class playerjwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-player',
) {
  constructor() {
    super({
      usernameField: 'email',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.PLAYER_SECRET_KEY}`,
    });
  }
  async validate(payload: playerjwtInterface) {
    return {
      email: payload.email,
      id: payload.id,
    };
  }
}
