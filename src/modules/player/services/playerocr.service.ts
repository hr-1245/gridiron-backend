import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PlayerEntity, PlayerImageEntity } from "../entity/players.entity";
import { Repository } from "typeorm";
import { CloudinaryService } from "src/modules/cloudinary/cloudinary.service";
import { userEntity } from "src/modules/user/entity/user.entity";
import { PlayerPositionEntity } from "../entity/player-position.entity";
import { ConversionDto, TightEndDto } from "../dto/convert-manually.dto";
import { ImageAnnotatorClient } from '@google-cloud/vision'; // Correct import
import { POSTION_CODE } from "src/types/enums/roles";
import { ConverstionDataDto, ImageConversionDto } from "../dto/image-conversion.dto";

@Injectable()
export class ocrService {
  private visionClient: ImageAnnotatorClient; // Type correctly set
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

    this.visionClient = new ImageAnnotatorClient();
  }

  async exectute(file: Express.Multer.File, obj: ImageConversionDto): Promise<any> {
    try {
      const { playerName, positionId, positionCode, data: rawData, draft_round } = obj

      const positionData = await this.playerPositionRepo.findOne({
        where: {
          id: positionId,
          code: positionCode,
        }
      });

      if (!positionData) {
        throw new NotFoundException('Invalid Position | Position Code');
      }

      let player: PlayerEntity | null;
      player = await this.playerRepo.findOne({
        where: { name: playerName },
      });

      if (!player) {
        const uploadedImage = await this.cloudinaryService.uploadFile(file);

        const newPlayer = this.playerRepo.create({
          images: uploadedImage ? [{ url: uploadedImage.secure_url }] : [],
          name: playerName,
          position: { id: positionId },
        });

        let { images, ...playerData } = newPlayer;
        player = await this.playerRepo.save(playerData);
        images = await this.playerImageRepo.save(images);
      }

      let dataobj: ConverstionDataDto;

      switch (obj.positionCode) {

        case POSTION_CODE.TightEnd:

          dataobj = rawData as TightEndDto;

          break;

        default:
          break;
      }


    } catch (error) {
      throw new Error(error.message);
    }
  }
}
