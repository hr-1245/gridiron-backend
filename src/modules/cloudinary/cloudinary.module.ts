import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { cloudinaryProvider } from './config/cloudinary';
import { TypeOrmModule } from '@nestjs/typeorm';
import { userEntity } from '../user/entity/userEntity';

@Module({
  imports: [TypeOrmModule.forFeature([userEntity])],
  providers: [CloudinaryService, cloudinaryProvider],
  exports: [CloudinaryService, cloudinaryProvider],
})
export class CloudinaryModule { }
