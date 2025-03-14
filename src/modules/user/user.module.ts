import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "./entity/user.entity";
import { userController } from "./user.controller";
import { userPlanEntity } from "src/entities/userPlan.entity";
import { stripeModule } from "../stripe/stripe.module";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity]), stripeModule],
  exports: [TypeOrmModule],
  controllers: [userController]
})
export class userModule { }
