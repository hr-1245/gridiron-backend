import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { forDatabasePostgresAsyncConfig } from './config/database';
import { adminjwtStrategy } from './providers/strategy/admin.strategy';
import { userjwtStrategy } from './providers/strategy/user.strategy';
import { authModule } from './modules/auth/auth.module';
import { jwtModule } from './modules/jwt/jwt.module';
import { playerModule } from './modules/player/player.module';
import { userModule } from './modules/user/user.module';
import { stripeModule } from './modules/stripe/stripe.module';
import { mailModule } from './modules/mail/mail.module';
import { OtpModule } from './modules/otp/otp.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
  TypeOrmModule.forRootAsync(forDatabasePostgresAsyncConfig),
    authModule,
    jwtModule,
    playerModule,
    userModule,
    stripeModule,
    mailModule,
    OtpModule
  ],
  providers: [adminjwtStrategy, userjwtStrategy],
})
export class AppModule { }
