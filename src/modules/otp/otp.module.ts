import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { otpEntity } from './entity/otp.entity';
import { otpService } from './otp.service';
import { userEntity } from '../user/entity/userEntity';


@Module({
  imports: [TypeOrmModule.forFeature([otpEntity, userEntity]), MailModule],
  providers: [otpService],
  exports: [otpService],
})
export class OtpModule { }