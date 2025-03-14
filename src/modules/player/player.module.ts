import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { playerAttributesEntity, playerEntity, playerImageEntity, playerPositionsEntity } from "./entity/player.entity";

@Module({
  imports: [TypeOrmModule.forFeature([playerEntity, playerPositionsEntity, playerAttributesEntity, playerImageEntity])],
  controllers: [],
  providers: [],
  exports: []
})
export class playerModule { }