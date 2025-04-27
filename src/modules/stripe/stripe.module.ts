import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from '../user/entity/userEntity';
import { discountConfigEntity, userPlanEntity } from "../user/entity/userPlan.entity";
import { adminauthEntity } from "../admin/entity/admin.entity";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity, discountConfigEntity, adminauthEntity])],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule { }
