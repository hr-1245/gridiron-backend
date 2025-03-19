import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayerAttributesEntity, PlayerEntity, PlayerImageEntity, PositionAttributeMappingEntity, } from "./entity/players.entity";
import { PlayerPositionEntity } from "./entity/player-position.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity, PlayerPositionEntity, PlayerAttributesEntity, PlayerImageEntity, PositionAttributeMappingEntity])],
  controllers: [],
  providers: [],
  exports: []
})
export class playerModule { }