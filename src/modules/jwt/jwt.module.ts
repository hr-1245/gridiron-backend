import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { adminjwtService } from './services/admin-jwt.service';
import { playerjwtService } from './services/player-jwt.service';

@Module({
  imports: [
    NestJwtModule.register({
      secret: process.env.ADMIN_SECRET_KEY,
      signOptions: { expiresIn: process.env.EXPIRES_IN },
    }),
    NestJwtModule.register({
      secret: process.env.PLAYER_SECRET_KEY,
      signOptions: { expiresIn: process.env.EXPIRES_IN },
    }),
  ],
  providers: [adminjwtService, playerjwtService],
  exports: [adminjwtService, playerjwtService],
})
export class jwtModule { }