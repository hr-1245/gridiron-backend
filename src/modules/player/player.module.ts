import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  PlayerAttributesEntity,
  PlayerEntity,
  PlayerImageEntity,
  PositionAttributeMappingEntity,
} from "./entity/players.entity";
import { PlayerPositionEntity } from "./entity/player-position.entity";
import { PlayerOcrController } from "./player.controller";
import { userEntity } from "../user/entity/user.entity";
import { playerService } from "./services/player.service";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { PlayerOcrService } from "./services/playerocr.service";
import { PlayerDataService } from "./services/playerdata.service";
import { BullModule } from "@nestjs/bull";
import { ProcessImageJob } from "../bull/services/bull.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      userEntity,
      PlayerEntity,
      PlayerPositionEntity,
      PlayerAttributesEntity,
      PlayerImageEntity,
      PositionAttributeMappingEntity,
    ]),
    CloudinaryModule,
    BullModule.registerQueue({
      name: 'imageProcessing',
    }),
  ],
  controllers: [PlayerOcrController],
  providers: [playerService, PlayerOcrService, PlayerDataService, ProcessImageJob],
  exports: [playerService, PlayerOcrService, PlayerDataService],
})
export class PlayerModule { }
