import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { adminJwtInterface } from 'src/modules/jwt/interface/jwt.interface';


@Injectable()
export class adminjwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-admin',
) {
  constructor() {
    super({
      usernameField: 'email',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.ADMIN_SECRET_KEY}`,
    });
  }
  async validate(payload: adminJwtInterface) {
    return {
      email: payload.email,
      id: payload.id,
    };
  }
}