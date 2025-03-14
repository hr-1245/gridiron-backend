import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { adminjwtService } from './services/admin-jwt.service';
import { userjwtService } from './services/player-jwt.service';

@Module({
  imports: [
    NestJwtModule.register({
      secret: process.env.ADMIN_SECRET_KEY,
      signOptions: { expiresIn: process.env.EXPIRES_IN },
    }),
    NestJwtModule.register({
      secret: process.env.USER_SECRET_KEY,
      signOptions: { expiresIn: process.env.EXPIRES_IN },
    }),
  ],
  providers: [adminjwtService, userjwtService],
  exports: [adminjwtService, userjwtService],
})
export class jwtModule { }