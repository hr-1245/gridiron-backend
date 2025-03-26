import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PlayerEntity, PlayerImageEntity } from "../entity/players.entity";
import { Repository } from "typeorm";
import { CloudinaryService } from "src/modules/cloudinary/cloudinary.service";
import { userEntity } from "src/modules/user/entity/user.entity";

@Injectable()
export class ocrService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,


    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>,

    @InjectRepository(PlayerImageEntity) private readonly playerImageRepo: Repository<PlayerImageEntity>,

    private readonly cloudinaryService: CloudinaryService
  ) {

  }

  async exectute() {

  }
}