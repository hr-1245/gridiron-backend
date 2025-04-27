import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { forDatabasePostgresAsyncConfig } from './config/database';
import { adminjwtStrategy } from './providers/strategy/admin.strategy';
import { userjwtStrategy } from './providers/strategy/user.strategy';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from './modules/jwt/jwt.module';
import { PlayerModule } from './modules/player/player.module';
import { UserModule } from './modules/user/user.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { MailModule } from './modules/mail/mail.module';
import { OtpModule } from './modules/otp/otp.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { AdminModule } from './modules/admin/admin.module';
import { BullConfigModule } from './modules/bull/bull.module';
import { redisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(forDatabasePostgresAsyncConfig),

    AuthModule,
    JwtModule,
    PlayerModule,
    UserModule,
    StripeModule,
    MailModule,
    OtpModule,
    CloudinaryModule,
    AdminModule,
    BullConfigModule,
    redisModule
  ],
  providers: [adminjwtStrategy, userjwtStrategy],
})
export class AppModule { }
