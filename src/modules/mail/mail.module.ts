// NestJS
import { Global, Module } from '@nestjs/common';
import { mailService } from './mail.service';


@Global()
@Module({
  providers: [mailService],
  exports: [mailService],
})
export class mailModule { }