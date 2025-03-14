import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { userModule } from "../user/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "../user/entity/user.entity";
import { userPlanEntity } from "src/entities/userPlan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity])],
  providers: [StripeService],
  exports: [StripeService],
})
export class stripeModule { }
