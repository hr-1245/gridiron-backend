import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PlayerAttributesEntity, PlayerEntity, PositionAttributeMappingEntity } from "./entity/players.entity";
import { Repository } from "typeorm";
import { PlayerPositionEntity } from "./entity/player-position.entity";
import { ConversionDto, ConverstionDataDto, TightEndDto } from "./dto/convert-manually.dto";
import { POSTION_CODE } from "src/types/enums/roles";

@Injectable()
export class playerService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,

    @InjectRepository(PlayerPositionEntity)
    private readonly playerPositionRepo: Repository<PlayerPositionEntity>,

    @InjectRepository(PositionAttributeMappingEntity)
    private readonly playerAttributesMapping: Repository<PositionAttributeMappingEntity>,

    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>

  ) {
  }
  //-- Get All Position with Their Attributes ----------------------

  async getAllPositionDropDown() {

    const data = await this.playerPositionRepo.find({
      relations: { attributeMappings: true }
    });
    return {
      message: "Fetched Positions Sucessfully",
      data
    }
  }
  // async getPositionAttributes(input: FetchPositionAttributesDto): Promise<PositionAttributesResponseDto> {
  //   // Fetch the position by code or name
  //   const position = await this.playerPositionRepo.findOne({
  //     where: [{ code: input.position }, { name: input.position }],
  //   });

  //   if (!position) {
  //     throw new NotFoundException(`Position with code or name '${input.position}' not found`);
  //   }

  //   const attributes = await this.playerAttributesMapping.find({
  //     where: { position: { id: position.id } },
  //     order: { displayOrder: "ASC" },
  //   });

  //   if (!attributes.length) {
  //     throw new Error(`No attributes found for position '${input.position}'`);
  //   }

  //   return {
  //     message: `${input.position} Position with its attribute fetched Sucessfully`,
  //     positionCode: position.code,
  //     positionName: position.name,
  //     attributes: attributes.map(attr => ({
  //       attributeKey: attr.attributeKey,
  //       conversionLogic: attr.conversionLogic,
  //       displayOrder: attr.displayOrder,
  //     })),
  //   };
  // }


  //----------CONVERSION LOGIC --------------------------------



  async conversionLogic(obj: ConversionDto): Promise<any | number> {
    //----------CONVERSION LOGIC --------------------------------
    try {
      const { playerName, positionId, positionCode, data: d } = obj

      const fetchData = await this.playerPositionRepo.findOne({
        where: {
          code: positionCode,
          id: positionId
        },
      })
      if (!fetchData) {
        throw new NotFoundException('Invalid Posiiton | Position Code')
      }

      let dataobj: ConverstionDataDto

      switch (obj.positionCode) {

        case POSTION_CODE.TightEnd:

          dataobj = d as TightEndDto;





          break;

        default:
          break;
      }

    }


    catch (error) {

    }
  }
}

