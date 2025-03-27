import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PlayerEntity, PlayerImageEntity } from "../entity/players.entity";
import { Repository } from "typeorm";
import { CloudinaryService } from "src/modules/cloudinary/cloudinary.service";
import { userEntity } from "src/modules/user/entity/user.entity";
import { PlayerPositionEntity } from "../entity/player-position.entity";
import { ConversionDto } from "../dto/convert-manually.dto";
import vision from '@google-cloud/vision';
@Injectable()
export class ocrService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,

    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>,

    @InjectRepository(PlayerImageEntity)
    private readonly playerImageRepo: Repository<PlayerImageEntity>,

    @InjectRepository(PlayerPositionEntity)
    private readonly playerPositionRepo: Repository<PlayerPositionEntity>,

    private readonly cloudinaryService: CloudinaryService
  ) {
    const client = new vision.ImageAnnotatorClient();
  }

  async exectute(data: ConversionDto, file: Express.Multer.File, userId: number) {
    try {

      const { playerName, positionId, positionCode, data: rawData, draft_round } = data

      const fetchData = await this.playerPositionRepo.findOne({
        where: {
          id: data.positionId,
          code: data.positionCode
        }
      })
      if (!fetchData) {
        throw new NotFoundException('Invalid Position | Position Code')
      }
      let player: PlayerEntity | null

      const image = this.cloudinaryService.uploadFile(
        file)
      if (!image) {
        throw new NotFoundException('Invalid Image')
      }
      const playerImage1 = this.playerImageRepo.create({
        url: (await image).secure_url,
      })
      this.playerImageRepo.save(playerImage1)

      player = await this.playerRepo.findOne({ where: { name: playerName } })
      if (!player) {

        const newPlayer = this.playerRepo.create({
          name: playerName,
          user: { id: userId },
          position: { id: positionId },
        })
        player = await this.playerRepo.save(newPlayer)
      }






    } catch (error) {


      throw new Error(error.message)
    }
  }
}