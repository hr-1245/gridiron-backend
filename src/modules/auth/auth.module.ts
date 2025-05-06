import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from '../user/entity/userEntity';
import { userAuthService } from "./services/userAuth.service";
import { adminauthEntity } from "../admin/entity/admin.entity";
import { adminauthService } from "./services/adminAuth.service";
import { userauthController } from "./controllers/userAuth.controller";
import { adminauthController } from "./controllers/adminAuth.controller";
import { JwtModule } from "../jwt/jwt.module";
import { MailModule } from "../mail/mail.module";
import { OtpModule } from "../otp/otp.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([userEntity, adminauthEntity]), 
    JwtModule,
    MailModule,
    OtpModule,
  ],
  controllers: [userauthController, adminauthController],
  providers: [userAuthService, adminauthService],
})
export class AuthModule {}
