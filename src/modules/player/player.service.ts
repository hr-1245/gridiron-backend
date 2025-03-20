import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PlayerAttributesEntity, PlayerEntity, PositionAttributeMappingEntity } from "./entity/players.entity";
import { Repository } from "typeorm";
import { PlayerPositionEntity } from "./entity/player-position.entity";
import { AttributeInputDto, convertManuallyDto, PositionInputDto } from "./dto/convert-manually";
import { FetchPositionAttributesDto, PositionAttributesResponseDto } from "./dto/fetchData.dto";

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
  //-- Get All Position ----------------------

  async getAllPositionDropDown() {

    const data = await this.playerPositionRepo.find();
    return {
      message: "Fetched Positions Sucessfully",
      data: data.map(position => ({
        code: position.code,
        name: position.name,
      })),
    }
  }

  async getPositionAttributes(input: FetchPositionAttributesDto): Promise<PositionAttributesResponseDto> {
    // Fetch the position by code or name
    const position = await this.playerPositionRepo.findOne({
      where: [{ code: input.position }, { name: input.position }],
    });

    if (!position) {
      throw new NotFoundException(`Position with code or name '${input.position}' not found`);
    }

    const attributes = await this.playerAttributesMapping.find({
      where: { position: { id: position.id } },
      order: { displayOrder: "ASC" },
    });

    if (!attributes.length) {
      throw new Error(`No attributes found for position '${input.position}'`);
    }

    return {
      message: `${input.position} Position with its attribute fetched Sucessfully`,
      positionCode: position.code,
      positionName: position.name,
      attributes: attributes.map(attr => ({
        attributeKey: attr.attributeKey,
        conversionLogic: attr.conversionLogic,
        displayOrder: attr.displayOrder,
      })),
    };
  }



}