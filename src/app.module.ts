import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { forDatabasePostgresAsyncConfig } from './config/database';
import { adminjwtStrategy } from './providers/strategy/admin.strategy';
import { userjwtStrategy } from './providers/strategy/user.strategy';
import { authModule } from './modules/auth/auth.module';
import { jwtModule } from './modules/jwt/jwt.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
  TypeOrmModule.forRootAsync(forDatabasePostgresAsyncConfig),
    authModule,
    jwtModule,
  ],
  providers: [adminjwtStrategy, userjwtStrategy],
})
export class AppModule { }
