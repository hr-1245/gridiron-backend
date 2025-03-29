import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayerAttributesEntity, PlayerEntity, PlayerImageEntity, PositionAttributeMappingEntity, } from "./entity/players.entity";
import { PlayerPositionEntity } from "./entity/player-position.entity";
import { PlayerController } from "./player.controller";
import { userEntity } from "../user/entity/user.entity";
import { playerService } from "./services/player.service";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { ocrService } from "./services/playerocr.service";
import { PlayerDataService } from "./services/playerdata.service";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, PlayerEntity, PlayerPositionEntity, PlayerAttributesEntity, PlayerImageEntity, PositionAttributeMappingEntity]),
    CloudinaryModule],
  controllers: [PlayerController],
  providers: [playerService, ocrService, PlayerDataService],
  exports: [playerService, ocrService, PlayerDataService]
})
export class playerModule { }