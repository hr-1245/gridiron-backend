import { Module } from "@nestjs/common";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { StripeService } from "../stripe/stripe.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from '../user/entity/userEntity';
import { discountConfigEntity, userPlanEntity } from "../user/entity/userPlan.entity";
import { adminController } from "./controllers/admin-stripe.controller";
import { adminauthEntity } from "./entity/admin.entity";
import { adminUserManagementController } from "./controllers/admin-user-managemnt.controller";
import { getAnalyticsService } from "./getAnalytics.service";
import { redisModule } from "../redis/redis.module";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity, discountConfigEntity, adminauthEntity]), redisModule],
  providers: [CloudinaryService, StripeService, getAnalyticsService],
  controllers: [adminController, adminUserManagementController]
})
export class AdminModule {

}