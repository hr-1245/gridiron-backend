import { Module } from "@nestjs/common";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { StripeService } from "../stripe/stripe.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "../user/entity/user.entity";
import { discountConfigEntity, userPlanEntity } from "../user/entity/userPlan.entity";
import { adminController } from "./entity/admin.controller";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity, discountConfigEntity])],
  providers: [CloudinaryService, StripeService],
  controllers: [adminController]
})
export class AdminModule {

}