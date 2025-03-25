import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConversionDto, ConverstionDataDto, CornerBackDto, DefensiveEndDto, EdgeRusherDto, InteriorOffensiveLinemanDto, LineBeckerDto, OffensiveTackleDto, QuarterBackDto, RunningBackDto, SafetyDto, TightEndDto, WideReceiverDto } from "../dto/convert-manually.dto"
import { POSTION_CODE } from "src/types/enums/roles";
import { PlayerPositionEntity } from "../entity/player-position.entity";
import { PlayerAttributesEntity, PlayerEntity } from "../entity/players.entity";

@Injectable()
export class playerService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,

    @InjectRepository(PlayerPositionEntity)
    private readonly playerPositionRepo: Repository<PlayerPositionEntity>,

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

        /////----------------------TE CONVERISON =----------
        case POSTION_CODE.TightEnd:

          dataobj = rawData as TightEndDto;

          const convertedData = {
            age: dataobj.age, // logic
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
          const resultTE = this.playerAttrRepo.create({
            player: { id: player.id },
            age: dataobj.age,
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
          await this.playerAttrRepo.save(resultTE)

          return {
            message: `Conversion of ${positionCode} Sucessfull`,
            resultTE
          }

        ///////////////////////////----------------QB CONVERISON=========================
        case POSTION_CODE.QuarterBack:

          dataobj = rawData as QuarterBackDto

          const convertedDataQB = {
            age: dataobj.age,  // logic need
            speed: dataobj.speed - 2,
            acceleration: dataobj.acceleration - 2,
            agility: dataobj.agility - 5,
            awareness: dataobj.awareness - 10 - (draft_round),
            throw_power: dataobj.throw_power - 1,
            throw_accuracy_short: dataobj.throw_accuracy_short - 7 - (draft_round),
            throw_accuracy_mid: dataobj.throw_accuracy_mid - 10 - (draft_round),
            throw_accuracy_deep: dataobj.throw_accuracy_deep - 14 - (draft_round),
            throw_on_the_run: dataobj.throw_on_the_run - 8 - (draft_round),
            throw_under_pressure: dataobj.throw_under_pressure - 11 - (draft_round),
            play_action: dataobj.play_action - 15 - (draft_round),
            break_sack: dataobj.break_sack - 9 - (draft_round),
            break_tackle: dataobj.break_tackle - 4 - (draft_round),
            trucking: dataobj.trucking - 13 - (draft_round),
            carrying: dataobj.carrying - 26 - (draft_round),
            ball_carrier_vision: dataobj.ball_carrier_vision - 13 - (draft_round),
            stiff_arm: dataobj.stiff_arm - 7 - (draft_round),
            spin_move: dataobj.spin_move - 14 - (draft_round),
            juke_move: dataobj.juke_move - 10 - (draft_round),
            stamina: dataobj.stamina - 2,
            injury: dataobj.injury - 1
          }


          const resultQB = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataQB.age,
            speed: convertedDataQB.speed,
            acceleration: convertedDataQB.acceleration,
            agility: convertedDataQB.acceleration,
            awareness: convertedDataQB.awareness,
            throw_power: convertedDataQB.throw_power,
            throw_accuracy_short: convertedDataQB.throw_accuracy_short,
            throw_accuracy_mid: convertedDataQB.throw_accuracy_mid,
            throw_accuracy_deep: convertedDataQB.throw_accuracy_deep,
            throw_on_the_run: convertedDataQB.throw_on_the_run,
            throw_under_pressure: convertedDataQB.throw_under_pressure,
            play_action: convertedDataQB.play_action,
            break_sack: convertedDataQB.break_sack,
            break_tackle: convertedDataQB.break_tackle,
            trucking: convertedDataQB.trucking,
            carrying: convertedDataQB.carrying,
            ball_carrier_vision: convertedDataQB.ball_carrier_vision,
            stiff_arm: convertedDataQB.stiff_arm,
            spin_move: convertedDataQB.spin_move,
            juke_move: convertedDataQB.juke_move,
            stamina: convertedDataQB.stamina,
            injury: convertedDataQB.injury

          })
          await this.playerAttrRepo.save(resultQB)
          return {
            message: `Conversion of ${positionCode} Sucessfull`,
            resultQB: resultQB
          }

        //------------------------------RB CONVERSION
        case POSTION_CODE.RunningBack:

          dataobj = rawData as RunningBackDto

          const convertedDataRB = {
            age: dataobj.age,  // logic need
            speed: dataobj.speed - 2,
            acceleration: dataobj.acceleration + 0,
            agility: dataobj.agility - 4,
            change_of_direction: dataobj.change_of_direction - 4,
            strength: dataobj.strength - 3,
            awareness: dataobj.awareness - 11 - (draft_round),
            break_tackle: dataobj.break_tackle - 7 - (draft_round),
            carrying: dataobj.carrying - 5 - (draft_round),
            trucking: dataobj.trucking - 7 - (draft_round),
            ball_carrier_vision: dataobj.ball_carrier_vision - 14 - (draft_round),
            catching: dataobj.catching - 14 - (draft_round),
            stiff_arm: dataobj.stiff_arm - 3 - (draft_round),
            spin_move: dataobj.spin_move - 8 - (draft_round),
            juke_move: dataobj.juke_move - 8 - (draft_round),
            pass_blocking: dataobj.pass_blocking - 24 - (draft_round),
            catch_in_traffic: dataobj.catch_in_traffic - 19 - (draft_round),
            spectacular_catch: dataobj.spectacular_catch - 12 - (draft_round),
            short_route_running: dataobj.short_route_running - 16 - (draft_round),
            medium_route_running: dataobj.short_route_running - 16 - (draft_round),
            release: dataobj.release - 7 - (draft_round),
            stamina: dataobj.stamina - 2,
            return: dataobj.return - 1,
            injury: dataobj.injury - 1

          }
          const resultRB = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataRB.age,
            speed: convertedDataRB.speed,
            acceleration: convertedDataRB.acceleration,
            agility: convertedDataRB.agility,
            change_of_direction: convertedDataRB.change_of_direction,
            strength: convertedDataRB.strength,
            awareness: convertedDataRB.awareness,
            break_tackle: convertedDataRB.break_tackle,
            carrying: convertedDataRB.carrying,
            trucking: convertedDataRB.trucking,
            ball_carrier_vision: convertedDataRB.ball_carrier_vision,
            catching: convertedDataRB.catching,
            stiff_arm: convertedDataRB.stiff_arm,
            spin_move: convertedDataRB.spin_move,
            juke_move: convertedDataRB.juke_move,
            pass_block: convertedDataRB.pass_blocking,
            catch_in_traffic: convertedDataRB.catch_in_traffic,
            spectacular_catch: convertedDataRB.spectacular_catch,
            short_route_running: convertedDataRB.short_route_running,
            medium_route_running: convertedDataRB.medium_route_running,
            release: convertedDataRB.release,
            stamina: convertedDataRB.stamina,
            return: convertedDataRB.return,
            injury: convertedDataRB.injury,
          });
          await this.playerAttrRepo.save(resultRB);

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultRB,
          };

        ///////////////---------------WR CONVERSION =========
        case POSTION_CODE.WiderReceiver:
          dataobj = rawData as WideReceiverDto

          const convertedDataWR = {
            age: dataobj.age,  // logic need
            speed: dataobj.speed - 2,
            acceleartion: dataobj.acceleration + 0,
            agility: dataobj.agility + 0,
            change_of_direction: dataobj.change_of_direction - 1,
            strength: dataobj.strength - 9,
            awareness: dataobj.awareness - 15 - (draft_round),
            break_tackle: dataobj.break_tackle - 3 - (draft_round),
            catch_in_traffic: dataobj.catch_in_traffic - 10 - (draft_round),
            spectacular_catch: dataobj.spectacular_catch - 5 - (draft_round),
            release: dataobj.release - 13 - (draft_round),
            jumping: dataobj.jumping - 3,
            carrying: dataobj.carrying - 14 - (draft_round),
            trucking: dataobj.trucking - 21 - (draft_round),
            ball_carrier_vision: dataobj.ball_carrier_vision - 15 - (draft_round),
            strength1: dataobj.strength - 7, // need reivison
            catching: dataobj.catching - 9 - (draft_round),
            stiff_arm: dataobj.stiff_arm - 7 - (draft_round),
            spin_move: dataobj.spin_move - 5 - (draft_round),
            juke_move: dataobj.juke_move - 3 - (draft_round),
            short_route_running: dataobj.short_route_running - 11 - (draft_round),
            medium_route_running: dataobj.medium_route_running - 16 - (draft_round),
            deep_route_running: dataobj.deep_route_running - 17 - (draft_round),
            jumping1: dataobj.jumping - 1, // need revision,
            stamina: dataobj.stamina - 1,
            return: dataobj.return - 1,
            injury: dataobj.injury - 1
          }

          const resultWR = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataWR.age,
            speed: convertedDataWR.speed,
            acceleration: convertedDataWR.acceleartion,
            agility: convertedDataWR.agility,
            change_of_direction: convertedDataWR.change_of_direction,
            strength: convertedDataWR.strength,
            awareness: convertedDataWR.awareness,
            break_tackle: convertedDataWR.break_tackle,
            catch_in_traffic: convertedDataWR.catch_in_traffic,
            spectacular_catch: convertedDataWR.spectacular_catch,
            release: convertedDataWR.release,
            jumping: convertedDataWR.jumping,
            carrying: convertedDataWR.carrying,
            trucking: convertedDataWR.trucking,
            ball_carrier_vision: convertedDataWR.ball_carrier_vision,
            catching: dataobj.catching,
            stiff_arm: dataobj.stiff_arm,
            spin_move: dataobj.spin_move,
            juke_move: dataobj.juke_move,
            short_route_running: dataobj.short_route_running,
            medium_route_running: dataobj.medium_route_running,
            stamina: dataobj.stamina,
            return: dataobj.return,
            injury: dataobj.injury
          });
          await this.playerAttrRepo.save(resultWR);

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultWR,
          };


        //-----------------------OT CONVERSION ------------------------
        case POSTION_CODE.OffensiveTackle:
          dataobj = rawData as OffensiveTackleDto

          const convertedDataOT = {
            age: dataobj.age, // logic need
            speed: dataobj.speed - 6,
            acceleration: dataobj.acceleration - 5,
            awareness: dataobj.awareness - 8 - (draft_round),
            agility: dataobj.agility - 13,
            strength: dataobj.strength + 1,
            lead_block: dataobj.lead_block - 9 - (draft_round),
            impact_block: dataobj.lead_block - 6 - (draft_round),
            run_block: dataobj.run_block - 15 - (draft_round),
            pass_block: dataobj.pass_block - 13 - (draft_round),
            pass_block_finesse: dataobj.pass_block_finesse - 14 - (draft_round),
            run_block_power: dataobj.run_block_power - 18 - (draft_round),
            run_block_finesse: dataobj.run_block_finesse - 14 - (draft_round),
            stamina: dataobj.stamina - 1,
            injury: dataobj.injury - 1
          }
          const resultOT = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataOT.age,
            speed: convertedDataOT.speed,
            acceleration: convertedDataOT.acceleration,
            awareness: convertedDataOT.awareness,
            agility: convertedDataOT.agility,
            strength: convertedDataOT.strength,
            lead_block: convertedDataOT.lead_block,
            impact_block: convertedDataOT.impact_block,
            run_block: convertedDataOT.run_block,
            pass_block: convertedDataOT.pass_block,
            pass_block_finesse: convertedDataOT.pass_block_finesse,
            run_block_power: convertedDataOT.run_block_power,
            run_block_finesse: convertedDataOT.run_block_finesse,
            stamina: convertedDataOT.stamina,
            injury: convertedDataOT.injury,
          });

          await this.playerAttrRepo.save(resultOT);

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultOT,
          };

        //--------------------------------IOL CONVERSION ----------------------
        case POSTION_CODE.InteriorOffensiveLineman:

          dataobj = rawData as InteriorOffensiveLinemanDto

          const convertedDataIOL = {
            age: dataobj.age, //logic need,
            speed: dataobj.speed,
            acceleartion: dataobj.acceleration - 3,
            awareness: dataobj.awareness - 9 - (draft_round),
            agility: dataobj.agility - 12,
            lead_block: dataobj.lead_block - 8 - (draft_round),
            impact_block: dataobj.impact_blocking - 3 - (draft_round),
            run_block: dataobj.run_blocking - 16 - (draft_round),
            pass_block: dataobj.pass_blocking - 12 - (draft_round),
            pass_block_power: dataobj.pass_block_power - 15 - (draft_round),
            pass_block_finesse: dataobj.pass_block_finesse - 16 - (draft_round),
            run_block_power: dataobj.run_block_power - 16 - (draft_round),
            run_block_finesse: dataobj.run_block_finesse - 16 - (draft_round),
            stamina: dataobj.stamina - 1,
            injury: dataobj.injury - 1
          }
          const resultIOL = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataIOL.age,
            speed: convertedDataIOL.speed,
            acceleration: convertedDataIOL.acceleartion,
            awareness: convertedDataIOL.awareness,
            agility: convertedDataIOL.agility,
            lead_block: convertedDataIOL.lead_block,
            impact_block: convertedDataIOL.impact_block,
            run_block: convertedDataIOL.run_block,
            pass_block: convertedDataIOL.pass_block,
            pass_block_power: convertedDataIOL.pass_block_power,
            pass_block_finesse: convertedDataIOL.pass_block_finesse,
            run_block_power: convertedDataIOL.run_block_power,
            run_block_finesse: convertedDataIOL.run_block_finesse,
            stamina: convertedDataIOL.stamina,
            injury: convertedDataIOL.injury
          });

          await this.playerAttrRepo.save(resultIOL);

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultIOL,
          };

        //----------------------------EDGE CONVERSION ------------------------------
        case POSTION_CODE.EdgeRusher:

          dataobj = rawData as EdgeRusherDto

          const convertedDataEDGE = {
            age: dataobj.age,
            speed: dataobj.speed - 4,
            acceleartion: dataobj.acceleration - 2,
            agility: dataobj.agility - 14,
            awareness: dataobj.awareness - 15 - (draft_round),
            strength: dataobj.strength - 2,
            tackling: dataobj.tackling - 13 - (draft_round),
            hit_power: dataobj.hit_power - 6,
            power_moves: dataobj.power_moves - 13 - (draft_round),
            finesse_moves: dataobj.finesse_moves - 8 - (draft_round),
            block_shed: dataobj.block_shed - 16 - (draft_round),
            pursuit: dataobj.pursuit - 16 - (draft_round),
            play_recognition: dataobj.play_recognition - 24 - (draft_round),
            stamina: dataobj.stamina - 1,
            injury: dataobj.injury - 1
          }

          const resultEDGE = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataEDGE.age,
            speed: convertedDataEDGE.speed,
            acceleration: convertedDataEDGE.acceleartion,
            agility: convertedDataEDGE.agility,
            awareness: convertedDataEDGE.awareness,
            strength: convertedDataEDGE.strength,
            tackling: convertedDataEDGE.tackling,
            hit_power: convertedDataEDGE.hit_power,
            power_moves: convertedDataEDGE.power_moves,
            finesse_moves: convertedDataEDGE.finesse_moves,
            block_shedding: convertedDataEDGE.block_shed,
            pursuit: convertedDataEDGE.pursuit,
            play_recognition: convertedDataEDGE.play_recognition,
            stamina: convertedDataEDGE.stamina,
            injury: convertedDataEDGE.injury
          });
          await this.playerAttrRepo.save(resultEDGE)

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultEDGE,
          }

        //-------------------------------DI CONVERSION --------------------
        case POSTION_CODE.DefensiveEnd:
          dataobj = rawData as DefensiveEndDto

          const convertedDataDI = {
            age: dataobj.age,
            speed: dataobj.speed - 1,
            acceleartion: dataobj.acceleration + 0,
            agility: dataobj.agility - 5,
            awareness: dataobj.awareness - 13 - (draft_round),
            strength: dataobj.strength + 0,
            tackling: dataobj.tackling - 11 - (draft_round),
            hit_power: dataobj.hit_power - 11,
            power_moves: dataobj.power_moves - 8 - (draft_round),
            finesse_moves: dataobj.finesse_moves - 9 - (draft_round),
            block_shed: dataobj.block_shedding - 10 - (draft_round),
            pursuit: dataobj.pursuit - 15 - (draft_round),
            play_recognition: dataobj.play_recognition - 18 - (draft_round),
            stamina: dataobj.stamina - 3,
            injury: dataobj.injury - 2
          }

          const resultDE = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataDI.age,
            speed: convertedDataDI.speed,
            acceleration: convertedDataDI.acceleartion,
            agility: convertedDataDI.agility,
            awareness: convertedDataDI.awareness,
            strength: convertedDataDI.strength,
            tackling: convertedDataDI.tackling,
            hit_power: convertedDataDI.hit_power,
            power_moves: convertedDataDI.power_moves,
            finesse_moves: convertedDataDI.finesse_moves,
            block_shedding: convertedDataDI.block_shed,
            pursuit: convertedDataDI.pursuit,
            play_recognition: convertedDataDI.play_recognition,
            stamina: convertedDataDI.stamina,
            injury: convertedDataDI.injury
          });
          await this.playerAttrRepo.save(resultDE)

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultDE,
          }

        //------------------------------ LB CONVERSION ================
        case POSTION_CODE.LineBacker:

          dataobj = rawData as LineBeckerDto

          const convertedDataLB = {
            age: dataobj.age, //logic
            speed: dataobj.speed - 4,
            acceleration: dataobj.acceleration - 2,
            agility: dataobj.agility - 2,
            change_of_direction: 'change_of_direction' in dataobj ? (dataobj.change_of_direction - 4) : undefined,
            awareness: dataobj.awareness - 9 - (draft_round),
            strength: dataobj.strength - 7,
            jumping: 'jumping' in dataobj ? dataobj.jumping - 12 : undefined,
            tackling: dataobj.tackling - 7 - (draft_round),
            hit_power: dataobj.hit_power - 3,
            power_moves: dataobj.power_moves - 21 - (draft_round),
            finesse_moves: dataobj.finesse_moves - 25 - (draft_round),
            block_shed: dataobj.block_shedding - 6 - (draft_round),
            pursuit: dataobj.pursuit - 6 - (draft_round),
            play_recognition: dataobj.play_recognition - 18 - (draft_round),
            man_coverage: 'man_coverage' in dataobj ? (dataobj.man_coverage - 25 - (draft_round)) : undefined,
            zone_coverage: 'zone_coverage' in dataobj ? (dataobj.zone_coverage - 22 - (draft_round)) : undefined,
            stamina: dataobj.stamina - 1,
            injury: dataobj.injury - 1
          }
          const resultLB = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataLB.age,
            speed: convertedDataLB.speed,
            acceleration: convertedDataLB.acceleration,
            agility: convertedDataLB.agility,
            change_of_direction: convertedDataLB.change_of_direction,
            awareness: convertedDataLB.awareness,
            strength: convertedDataLB.strength,
            jumping: convertedDataLB.jumping,
            tackling: convertedDataLB.tackling,
            hit_power: convertedDataLB.hit_power,
            power_moves: convertedDataLB.power_moves,
            finesse_moves: convertedDataLB.finesse_moves,
            block_shedding: convertedDataLB.block_shed,
            pursuit: convertedDataLB.pursuit,
            play_recognition: convertedDataLB.play_recognition
          });
          await this.playerAttrRepo.save(resultLB)

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultLB,
          }


        //------------------------CB CONVERSION ------------------------------ 
        case POSTION_CODE.CornerBack:

          dataobj = rawData as CornerBackDto

          const convertedDataCB = {
            age: dataobj.age, // logic
            speed: dataobj.speed - 4,
            acceleration: dataobj.acceleration + 0,
            agility: dataobj.agility + 0,
            catch_of_direction: dataobj.change_of_direction - 2,
            catching: 'catching' in dataobj ? (dataobj.catching - 19 - (draft_round)) : undefined,
            awareness: dataobj.awareness - 7 - (draft_round),
            strength: dataobj.strength - 8,
            jumping: dataobj.jumping - 1,
            tackling: 'tackling' in dataobj ? (dataobj.tackling - 8 - (draft_round)) : undefined,
            hit_power: dataobj.hit_power - 10,
            pursuit: dataobj.pursuit - 13 - (draft_round),
            play_recognition: dataobj.play_recognition - 15 - (draft_round),
            man_coverage: dataobj.man_coverage - 13 - (draft_round),
            zone_coverage: dataobj.zone_coverage - 13 - (draft_round),
            press: dataobj.press - 10 - (draft_round),
            return: dataobj.return + 0,
            stamina: dataobj.stamina - 1,
            injury: dataobj.injury - 1

          }
          const resultCB = this.playerAttrRepo.create({
            age: convertedDataCB.age,
            speed: convertedDataCB.speed,
            acceleration: convertedDataCB.acceleration,
            agility: convertedDataCB.agility,
            change_of_direction: convertedDataCB.catch_of_direction,
            catching: convertedDataCB.catching,
            awareness: convertedDataCB.awareness,
            strength: convertedDataCB.strength,
            jumping: convertedDataCB.jumping,
            tackling: convertedDataCB.tackling,
            hit_power: convertedDataCB.hit_power,
            pursuit: convertedDataCB.pursuit,
            man_coverage: convertedDataCB.man_coverage,
            zone_coverage: convertedDataCB.zone_coverage,
            press: convertedDataCB.press,
            return: convertedDataCB.return,
            stamina: convertedDataCB.stamina,
            injury: convertedDataCB.injury,
            play_recognition: convertedDataCB.play_recognition
          });
          await this.playerAttrRepo.save(resultCB)

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultCB,
          }

        //------------------S CONVERSION --------------------------
        case POSTION_CODE.Safety:

          dataobj = rawData as SafetyDto

          const convertedDataS = {
            age: dataobj.age, // logic
            speed: dataobj.speed - 1,
            acceleration: dataobj.acceleration - 1,
            agility: dataobj.agility + 1,
            cod: dataobj.change_of_direction - 9,
            catching: dataobj.catching - 22 - (draft_round),
            awareness: dataobj.awareness - 8 - (draft_round),
            strength: dataobj.strength - 11,
            block_shed: 'block_shed' in dataobj ? (dataobj.block_shed - 8 - (draft_round)) : undefined,
            jumping: dataobj.jumping - 6,
            tackling: dataobj.tackling - 7 - (draft_round),
            hit_power: dataobj.hit_power - 8,
            pursuit: dataobj.pursuit - 11 - (draft_round),
            play_recognition: dataobj.play_recognition - 18 - (draft_round),
            man_coverage: dataobj.man_coverage - 6 - (draft_round),
            zone_coverage: dataobj.zone_coverage - 15 - (draft_round),
            press: dataobj.press - 6 - (draft_round),
            stamina: dataobj.stamina - 1,
            injury: dataobj.injury - 1,
          }
          const resultS = this.playerAttrRepo.create({
            player: { id: player.id },
            age: convertedDataS.age,
            speed: convertedDataS.speed,
            acceleration: convertedDataS.acceleration,
            agility: convertedDataS.agility,
            change_of_direction: convertedDataS.cod,
            catching: convertedDataS.catching,
            awareness: convertedDataS.awareness,
            strength: convertedDataS.strength,
            block_shedding: convertedDataS.block_shed,
            jumping: convertedDataS.jumping,
            tackling: convertedDataS.tackling,
            hit_power: convertedDataS.hit_power,
            pursuit: convertedDataS.pursuit,
            man_coverage: convertedDataS.man_coverage,
            zone_coverage: convertedDataS.zone_coverage,
            press: convertedDataS.press,
            stamina: convertedDataS.stamina,
            injury: convertedDataS.injury,
            play_recognition: convertedDataS.play_recognition,
          })
          await this.playerAttrRepo.save(resultS)

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: resultS,
          }

        default:
          throw new Error('Invalid Position Code')
      }
    }

    catch (error) {
      throw new Error(error.message)
    }
  }

}