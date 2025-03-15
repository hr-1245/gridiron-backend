import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "./entity/user.entity";
import { userController } from "./user.controller";
import { stripeModule } from "../stripe/stripe.module";
import { userPlanEntity } from "./entity/userPlan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity]), stripeModule],
  exports: [TypeOrmModule],
  controllers: [userController]
})
export class userModule { }
