import { Module } from "@nestjs/common";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { StripeService } from "../stripe/stripe.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "../user/entity/user.entity";
import { discountConfigEntity, userPlanEntity } from "../user/entity/userPlan.entity";
import { adminController } from "./admin.controller";
import { adminauthEntity } from "./entity/admin.entity";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity, discountConfigEntity, adminauthEntity])],
  providers: [CloudinaryService, StripeService],
  controllers: [adminController]
})
export class AdminModule {

}