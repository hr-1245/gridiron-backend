import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { userjwtInterface } from 'src/modules/jwt/interface/jwt.interface';


@Injectable()
export class userjwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-user',
) {
  constructor() {
    super({
      usernameField: 'email',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.USER_SECRET_KEY}`,
    });
  }
  async validate(payload: userjwtInterface) {
    return {
      email: payload.email,
      id: payload.id,
    };
  }
}
