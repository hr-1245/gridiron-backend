import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "./entity/user.entity";
import { userController } from ".//controller/userStripe.controller";
import { StripeModule } from "../stripe/stripe.module";
import { userPlanEntity } from "./entity/userPlan.entity";
import { PlayerModule } from "../player/player.module";
import { userPlayerCardsController } from "./controller/getAllPlayers.controller";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity]), StripeModule, PlayerModule],
  exports: [TypeOrmModule],
  controllers: [userController, userPlayerCardsController]
})
export class UserModule { }
