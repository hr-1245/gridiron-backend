import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { playerauthEntity } from "../player/entity/player.entity";
import { playerAuthService } from "./services/playerAuth.service";
import { adminauthEntity } from "../admin/entity/admin.entity";
import { adminauthService } from "./services/adminAuth.service";
import { playerauthController } from "./controllers/playerAuth.controller";
import { adminauthController } from "./controllers/adminAuth.controller";
import { jwtModule } from "../jwt/jwt.module";

@Module({
  imports: [TypeOrmModule.forFeature([playerauthEntity, adminauthEntity]), jwtModule],
  controllers: [playerauthController, adminauthController],
  providers: [playerAuthService, adminauthService],
})

export class authModule { }