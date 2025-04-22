import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "../user/entity/user.entity";
import { discountConfigEntity, userPlanEntity } from "../user/entity/userPlan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity, discountConfigEntity, ])],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule { }
