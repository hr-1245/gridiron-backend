import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authModule } from '../auth/auth.module';
import { mailModule } from '../mail/mail.module';
import { otpEntity } from './entity/otp.entity';
import { otpService } from './otp.service';
import { userEntity } from '../user/entity/user.entity';


@Module({
  imports: [TypeOrmModule.forFeature([otpEntity, userEntity]), mailModule],
  providers: [otpService],
  exports: [otpService],
})
export class OtpModule { }