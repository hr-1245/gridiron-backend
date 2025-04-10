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
import { BullModule } from '@nestjs/bull';
import { BullModel } from './modules/bull/bull.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
  TypeOrmModule.forRootAsync(forDatabasePostgresAsyncConfig),
  BullModule.forRoot({
    redis: {
      connectionName: 'localhost',
      host: '6979'
    }
  }),
    AuthModule,
    JwtModule,
    PlayerModule,
    UserModule,
    StripeModule,
    MailModule,
    OtpModule,
    CloudinaryModule,
    BullModel
  ],
  providers: [adminjwtStrategy, userjwtStrategy],
})
export class AppModule { }
