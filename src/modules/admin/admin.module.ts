import { Module } from "@nestjs/common";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { StripeService } from "../stripe/stripe.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "../user/entity/user.entity";
import { discountConfigEntity, userPlanEntity } from "../user/entity/userPlan.entity";
import { adminController } from "./controllers/admin-stripe.controller";
import { adminauthEntity } from "./entity/admin.entity";
import { adminService } from "./admin.service";
import { adminUserManagementController } from "./controllers/admin-user-managemnt.controller";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity, discountConfigEntity, adminauthEntity])],
  providers: [CloudinaryService, StripeService, adminService],
  controllers: [adminController, adminUserManagementController]
})
export class AdminModule {

}