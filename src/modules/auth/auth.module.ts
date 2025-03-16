import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "../user/entity/user.entity";
import { userAuthService } from "./services/userAuth.service";
import { adminauthEntity } from "../admin/entity/admin.entity";
import { adminauthService } from "./services/adminAuth.service";
import { userauthController } from "./controllers/userAuth.controller";
import { adminauthController } from "./controllers/adminAuth.controller";
import { jwtModule } from "../jwt/jwt.module";
import { mailModule } from "../mail/mail.module";
import { OtpModule } from "../otp/otp.module";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, adminauthEntity]), jwtModule, mailModule, OtpModule],
  controllers: [userauthController, adminauthController],
  providers: [userAuthService, adminauthService],
})

export class authModule { }