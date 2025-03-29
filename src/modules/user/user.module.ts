import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userEntity } from "./entity/user.entity";
import { userController } from ".//controller/userStripe.controller";
import { stripeModule } from "../stripe/stripe.module";
import { userPlanEntity } from "./entity/userPlan.entity";
import { playerModule } from "../player/player.module";
import { userPlayerCardsController } from "./controller/getAllPlayers.controller";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, userPlanEntity]), stripeModule, playerModule],
  exports: [TypeOrmModule],
  controllers: [userController, userPlayerCardsController]
})
export class userModule { }
