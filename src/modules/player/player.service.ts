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



  async conversionLogic(obj: ConversionDto, userId: number): Promise<any> {
    //----------CONVERSION LOGIC --------------------------------
    try {
      const { playerName, positionId, positionCode, data: rawData, draft_round } = obj

      const fetchData = await this.playerPositionRepo.findOne({
        where: { id: positionId, code: positionCode },
      })
      if (!fetchData) {
        throw new NotFoundException('Invalid Posiiton | Position Code')
      }
      let player: PlayerEntity | null
      player = await this.playerRepo.findOne({ where: { name: playerName } })
      if (!player) {

        const newPlayer = this.playerRepo.create({
          name: playerName,
          user: { id: userId },
          position: { id: positionId },
        });
        player = await this.playerRepo.save(newPlayer)
      }

      let dataobj: ConverstionDataDto


      switch (obj.positionCode) {

        case POSTION_CODE.TightEnd:

          dataobj = rawData as TightEndDto;

          const convertedData = {
            speed: dataobj.speed + 0,
            acceleration: dataobj.acceleration + 2,
            agility: dataobj.agility + 1,
            changeOfDirecton: dataobj.change_of_direction + 3,
            strength: dataobj.strength - 3,
            awareness: dataobj.awareness - 4,
            breakTackle: dataobj.break_tackle - 2 - (draft_round),
            catchInTraffic: dataobj.catch_in_traffic - 1 - (draft_round),
            spectacularCatch: dataobj.spectacular_catch + 0 - (draft_round),
            release: dataobj.release + 2 - (draft_round),
            passBlock: dataobj.pass_block - 14 - (draft_round),
            passBlockPower: dataobj.pass_block_power - 14 - (draft_round),
            passBlockFinesse: dataobj.pass_block_finesse - 10 - (draft_round),
            runBlock: dataobj.run_block - 11 - (draft_round),
            runBlockPower: dataobj.run_block_power - 12 - (draft_round),
            runBlockfinesse: dataobj.run_block_finesse - 16 - (draft_round),
            leadBlocking: dataobj.lead_blocking - 4 - (draft_round),
            impactBlocking: dataobj.impact_blocking + 7 - (draft_round),
            jumping: dataobj.jumping + 3,
            carrying: dataobj.carrying - 1 - (draft_round),
            trucking: dataobj.trucking + 0 - (draft_round),
            catching: dataobj.catching + 0 - (draft_round),
            stiffArm: dataobj.stiff_arm + 0 - (draft_round),
            spinMove: dataobj.spin_move - 1 - (draft_round),
            jukeMove: dataobj.juke_move - 1 - (draft_round),
            shortRouteRunning: dataobj.short_route_running - 12 - (draft_round),
            mediumRouteRunning: dataobj.medium_route_running - 13 - (draft_round),
            deepRouteRunning: dataobj.deep_route_running - 6 - (draft_round),
            jumping1: dataobj.jumping + 2,
            stamina: dataobj.stamina - 1,
            injury: dataobj.injury - 1
          }
          const result = this.playerAttrRepo.create({
            player: { id: player.id },
            speed: convertedData.speed,
            acceleration: convertedData.acceleration,
            agility: convertedData.agility,
            change_of_direction: convertedData.changeOfDirecton,
            strength: convertedData.strength,
            awareness: convertedData.awareness,
            break_tackle: convertedData.breakTackle,
            catch_in_traffic: convertedData.catchInTraffic,
            spectacular_catch: convertedData.spectacularCatch,
            release: convertedData.release,
            pass_block: convertedData.passBlock,
            pass_block_power: convertedData.passBlockPower,
            pass_block_finesse: convertedData.passBlockFinesse,
            run_block: convertedData.runBlock,
            run_block_power: convertedData.runBlockPower,
            run_block_finesse: convertedData.runBlockfinesse,
            lead_block: convertedData.leadBlocking,
            impact_block: convertedData.impactBlocking,
            jumping: convertedData.jumping,
            carrying: convertedData.carrying,
            trucking: convertedData.trucking,
            catching: convertedData.catching,
            stiff_arm: convertedData.stiffArm,
            spin_move: convertedData.spinMove,
            juke_move: convertedData.jukeMove,
            short_route_running: convertedData.shortRouteRunning,
            medium_route_running: convertedData.mediumRouteRunning,
            deep_route_running: convertedData.deepRouteRunning,
            stamina: convertedData.stamina,
            injury: convertedData.injury
          })
          await this.playerAttrRepo.save(result)

          return {
            message: "Conversion Sucessfull",
            result,
          
          }

        default:
          throw new Error("Invalid Position Code")


          break;
      }

    }


    catch (error) {
      throw new Error(error.message)
    }
  }
}

