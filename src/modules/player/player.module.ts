import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayerAttributesEntity, PlayerEntity, PlayerImageEntity, PositionAttributeMappingEntity, } from "./entity/players.entity";
import { PlayerPositionEntity } from "./entity/player-position.entity";
import { PlayerOcrController } from "./player.controller";
import { userEntity } from "../user/entity/user.entity";
import { playerService } from "./services/player.service";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { PlayerOcrService } from "./services/playerocr.service";
import { PlayerDataService } from "./services/playerdata.service";
import { jwtModule } from "../jwt/jwt.module";

@Module({
  imports: [TypeOrmModule.forFeature([userEntity, PlayerEntity, PlayerPositionEntity, PlayerAttributesEntity, PlayerImageEntity, PositionAttributeMappingEntity]),
    CloudinaryModule],
  controllers: [PlayerOcrController],
  providers: [playerService, PlayerOcrService, PlayerDataService],
  exports: [playerService, PlayerOcrService, PlayerDataService]
})
export class playerModule { }