import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { All_Middle_LinebackersDTO, ConversionDto, ConverstionDataDto, CornerBackDto, DefensiveTackleDto, FullBackDto, KickerDto, Left_Outside_linebacker_above_245_lbsDTO, LeftEndDTO, LeftGaurdDto, LeftOutside_linebacker_below_245lbsDTO, LeftTackleDto, PunterDto, QuarterBackDto, Right_Outside_linebacker_above_245lbsDTO, RightEndDTO, RightGaurdDto, RightOutside_linebacker_below_245lbsDTO, RightTackleDto, RunningBackDto, SafetyDto, TightEndDto, WideReceiverDto } from "../dto/convert-manually.dto"
import { COLLAGE_AGE_ENUM, POSTION_CODE, CollageAgeMapping } from "src/types/enums/roles";
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
    let data = await this.playerPositionRepo.find({
      relations: { attributeMappings: true }
    });

    const cleanedData = data.map(position => ({
      code: position.code,
      name: position.name,
      attributeMappings: position.attributeMappings.map(attr => ({
        attributeKey: attr.attributeKey,
        displayOrder: attr.displayOrder
      }))
    }));

    return {
      message: "Fetched Positions Successfully",
      data: cleanedData
    };
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
      const { playerName, positionId, positionCode, data: rawData, draft_round, ovr, height, homeTown, weight } = obj

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
          overallRating: ovr,
          height: height,
          homeTown: homeTown,
          weight: weight,
        });
        player = await this.playerRepo.save(newPlayer)
      }

      let dataobj: ConverstionDataDto


      const randomAge = Math.floor(Math.random() * 2) + 17;
      const collegeYearKey = rawData.age as unknown as COLLAGE_AGE_ENUM;
      const collegeYearAge = CollageAgeMapping[collegeYearKey];
      if (collegeYearAge === undefined) {
        throw new Error(`Invalid college year key: ${collegeYearKey}`);

      }
      const calculatedAge = randomAge + collegeYearAge;

      switch (obj.positionCode || rawData.age) {
        /////----------------------TE CONVERISON =----------

        case POSTION_CODE.TightEnd:
          dataobj = rawData as TightEndDto;

          const convertedData = {
            age: calculatedAge,
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
            stamina: dataobj.stamina - 1,
            injury: dataobj.injury - 1
          }
          const resultTE = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
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
          const cleanedResultTE = Object.keys(resultTE).reduce((acc, key) => {
            if (resultTE[key] !== null && resultTE[key] !== undefined) {
              acc[key] = resultTE[key];
            }
            return acc;
          }, {});
          return {
            message: `Conversion of ${positionCode} Sucessfull`,
            resultTE: cleanedResultTE
          }

        ///////////////////////////----------------QB CONVERISON=========================
        case POSTION_CODE.QuarterBack:

          dataobj = rawData as QuarterBackDto

          const convertedDataQB = {
            age: calculatedAge,
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
            age: calculatedAge,
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
          const cleanedResultQB = Object.keys(resultQB).reduce((acc, key) => {
            if (resultQB[key] !== null && resultQB[key] !== undefined) {
              acc[key] = resultQB[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultQB,
          }

        //------------------------------RB CONVERSION
        case POSTION_CODE.RunningBack:

          dataobj = rawData as RunningBackDto

          const convertedDataRB = {
            age: calculatedAge,
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
            age: calculatedAge,
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

          const cleanedResultRB = Object.keys(resultRB).reduce((acc, key) => {
            if (resultRB[key] !== null && resultRB[key] !== undefined) {
              acc[key] = resultRB[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultRB,
          }


        ///////////////---------------WR CONVERSION =========
        case POSTION_CODE.WiderReceiver:
          dataobj = rawData as WideReceiverDto

          const convertedDataWR = {
            age: calculatedAge,
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
            catching: dataobj.catching - 9 - (draft_round),
            stiff_arm: dataobj.stiff_arm - 7 - (draft_round),
            spin_move: dataobj.spin_move - 5 - (draft_round),
            juke_move: dataobj.juke_move - 3 - (draft_round),
            short_route_running: dataobj.short_route_running - 11 - (draft_round),
            medium_route_running: dataobj.medium_route_running - 16 - (draft_round),
            deep_route_running: dataobj.deep_route_running - 17 - (draft_round),
            stamina: dataobj.stamina - 1,
            return: dataobj.return - 1,
            injury: dataobj.injury - 1
          }

          const resultWR = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
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

          const cleanedResultWR = Object.keys(resultWR).reduce((acc, key) => {
            if (resultWR[key] !== null && resultWR[key] !== undefined) {
              acc[key] = resultWR[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultWR,
          }

        //-----------------------LT Conversion ------------------------
        case POSTION_CODE.LeftTackle:
          dataobj = rawData as LeftTackleDto

          const convertedDataLT = {
            age: calculatedAge,
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
          const resultLT = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataLT.speed,
            acceleration: convertedDataLT.acceleration,
            awareness: convertedDataLT.awareness,
            agility: convertedDataLT.agility,
            strength: convertedDataLT.strength,
            lead_block: convertedDataLT.lead_block,
            impact_block: convertedDataLT.impact_block,
            run_block: convertedDataLT.run_block,
            pass_block: convertedDataLT.pass_block,
            pass_block_finesse: convertedDataLT.pass_block_finesse,
            run_block_power: convertedDataLT.run_block_power,
            run_block_finesse: convertedDataLT.run_block_finesse,
            stamina: convertedDataLT.stamina,
            injury: convertedDataLT.injury,
          });

          await this.playerAttrRepo.save(resultLT);
          const cleanedResultLT = Object.keys(resultLT).reduce((acc, key) => {
            if (resultLT[key] !== null && resultLT[key] !== undefined) {
              acc[key] = resultLT[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultLT,
          }

        //---------------RT CONVERSION=-----------------

        case POSTION_CODE.RightTackle:
          dataobj = rawData as RightTackleDto

          const convertedDataRT = {
            age: calculatedAge,
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
          const resultRT = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataRT.speed,
            acceleration: convertedDataRT.acceleration,
            awareness: convertedDataRT.awareness,
            agility: convertedDataRT.agility,
            strength: convertedDataRT.strength,
            lead_block: convertedDataRT.lead_block,
            impact_block: convertedDataRT.impact_block,
            run_block: convertedDataRT.run_block,
            pass_block: convertedDataRT.pass_block,
            pass_block_finesse: convertedDataRT.pass_block_finesse,
            run_block_power: convertedDataRT.run_block_power,
            run_block_finesse: convertedDataRT.run_block_finesse,
            stamina: convertedDataRT.stamina,
            injury: convertedDataRT.injury,
          });

          await this.playerAttrRepo.save(resultRT);
          const cleanedResultRT = Object.keys(resultRT).reduce((acc, key) => {
            if (resultRT[key] !== null && resultRT[key] !== undefined) {
              acc[key] = resultRT[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultRT,
          }


        //--------------------------------LG CONVERSION ----------------------
        case POSTION_CODE.LeftGuard:

          dataobj = rawData as LeftGaurdDto

          const convertedDataLG = {
            age: calculatedAge,
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
          const resultLG = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataLG.speed,
            acceleration: convertedDataLG.acceleartion,
            awareness: convertedDataLG.awareness,
            agility: convertedDataLG.agility,
            lead_block: convertedDataLG.lead_block,
            impact_block: convertedDataLG.impact_block,
            run_block: convertedDataLG.run_block,
            pass_block: convertedDataLG.pass_block,
            pass_block_power: convertedDataLG.pass_block_power,
            pass_block_finesse: convertedDataLG.pass_block_finesse,
            run_block_power: convertedDataLG.run_block_power,
            run_block_finesse: convertedDataLG.run_block_finesse,
            stamina: convertedDataLG.stamina,
            injury: convertedDataLG.injury
          });

          await this.playerAttrRepo.save(resultLG);

          const cleanedResultLG = Object.keys(resultLG).reduce((acc, key) => {
            if (resultLG[key] !== null && resultLG[key] !== undefined) {
              acc[key] = resultLG[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultLG,
          }

        //---------------------LG CONVERSION ---------------
        case POSTION_CODE.RightGuard:

          dataobj = rawData as RightGaurdDto

          const convertedDataRG = {
            age: calculatedAge,
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
          const resultRG = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataRG.speed,
            acceleration: convertedDataRG.acceleartion,
            awareness: convertedDataRG.awareness,
            agility: convertedDataRG.agility,
            lead_block: convertedDataRG.lead_block,
            impact_block: convertedDataRG.impact_block,
            run_block: convertedDataRG.run_block,
            pass_block: convertedDataRG.pass_block,
            pass_block_power: convertedDataRG.pass_block_power,
            pass_block_finesse: convertedDataRG.pass_block_finesse,
            run_block_power: convertedDataRG.run_block_power,
            run_block_finesse: convertedDataRG.run_block_finesse,
            stamina: convertedDataRG.stamina,
            injury: convertedDataRG.injury
          });

          await this.playerAttrRepo.save(resultRG);

          const cleanedResultRG = Object.keys(resultRG).reduce((acc, key) => {
            if (resultRG[key] !== null && resultRG[key] !== undefined) {
              acc[key] = resultRG[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultRG,
          }

        //----------------------------LE CONVERSION ------------------------------
        case POSTION_CODE.LeftEnd:

          dataobj = rawData as LeftEndDTO

          const convertedDataLE = {
            age: calculatedAge,
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

          const resultLE = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataLE.speed,
            acceleration: convertedDataLE.acceleartion,
            agility: convertedDataLE.agility,
            awareness: convertedDataLE.awareness,
            strength: convertedDataLE.strength,
            tackling: convertedDataLE.tackling,
            hit_power: convertedDataLE.hit_power,
            power_moves: convertedDataLE.power_moves,
            finesse_moves: convertedDataLE.finesse_moves,
            block_shedding: convertedDataLE.block_shed,
            pursuit: convertedDataLE.pursuit,
            play_recognition: convertedDataLE.play_recognition,
            stamina: convertedDataLE.stamina,
            injury: convertedDataLE.injury
          });
          await this.playerAttrRepo.save(resultLE)
          const cleanedResultLE = Object.keys(resultLE).reduce((acc, key) => {
            if (resultLE[key] !== null && resultLE[key] !== undefined) {
              acc[key] = resultLE[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultLE,
          }
        //----------------------------RE CONVERSION ------------------------------
        case POSTION_CODE.RightEnd:

          dataobj = rawData as RightEndDTO

          const convertedDataRE = {
            age: calculatedAge,
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

          const resultRE = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataRE.speed,
            acceleration: convertedDataRE.acceleartion,
            agility: convertedDataRE.agility,
            awareness: convertedDataRE.awareness,
            strength: convertedDataRE.strength,
            tackling: convertedDataRE.tackling,
            hit_power: convertedDataRE.hit_power,
            power_moves: convertedDataRE.power_moves,
            finesse_moves: convertedDataRE.finesse_moves,
            block_shedding: convertedDataRE.block_shed,
            pursuit: convertedDataRE.pursuit,
            play_recognition: convertedDataRE.play_recognition,
            stamina: convertedDataRE.stamina,
            injury: convertedDataRE.injury
          });
          await this.playerAttrRepo.save(resultRE)
          const cleanedResultRE = Object.keys(resultRE).reduce((acc, key) => {
            if (resultRE[key] !== null && resultRE[key] !== undefined) {
              acc[key] = resultRE[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultRE,
          }


        //----------------------------LOLB> CONVERSION ------------------------------
        case POSTION_CODE.LeftOutside_linebacker_above_245_lbs:

          dataobj = rawData as Left_Outside_linebacker_above_245_lbsDTO

          const convertedDataLOLB = {
            age: calculatedAge,
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

          const resultLOLB = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataLOLB.speed,
            acceleration: convertedDataLOLB.acceleartion,
            agility: convertedDataLOLB.agility,
            awareness: convertedDataLOLB.awareness,
            strength: convertedDataLOLB.strength,
            tackling: convertedDataLOLB.tackling,
            hit_power: convertedDataLOLB.hit_power,
            power_moves: convertedDataLOLB.power_moves,
            finesse_moves: convertedDataLOLB.finesse_moves,
            block_shedding: convertedDataLOLB.block_shed,
            pursuit: convertedDataLOLB.pursuit,
            play_recognition: convertedDataLOLB.play_recognition,
            stamina: convertedDataLOLB.stamina,
            injury: convertedDataLOLB.injury
          });
          await this.playerAttrRepo.save(resultLOLB)
          const cleanedResultLOLB = Object.keys(resultLOLB).reduce((acc, key) => {
            if (resultLOLB[key] !== null && resultLOLB[key] !== undefined) {
              acc[key] = resultLOLB[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultLOLB,
          }


        //----------------------------ROLB> CONVERSION ------------------------------
        case POSTION_CODE.RightOutside_linebacker_above_245lbs:

          dataobj = rawData as Right_Outside_linebacker_above_245lbsDTO

          const convertedDataROLB = {
            age: calculatedAge,
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

          const resultROLB = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataROLB.speed,
            acceleration: convertedDataROLB.acceleartion,
            agility: convertedDataROLB.agility,
            awareness: convertedDataROLB.awareness,
            strength: convertedDataROLB.strength,
            tackling: convertedDataROLB.tackling,
            hit_power: convertedDataROLB.hit_power,
            power_moves: convertedDataROLB.power_moves,
            finesse_moves: convertedDataROLB.finesse_moves,
            block_shedding: convertedDataROLB.block_shed,
            pursuit: convertedDataROLB.pursuit,
            play_recognition: convertedDataROLB.play_recognition,
            stamina: convertedDataROLB.stamina,
            injury: convertedDataROLB.injury
          });
          await this.playerAttrRepo.save(resultROLB)
          const cleanedResultROLB = Object.keys(resultROLB).reduce((acc, key) => {
            if (resultROLB[key] !== null && resultROLB[key] !== undefined) {
              acc[key] = resultROLB[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultROLB,
          }

        //-------------- DT CONVERSION -----------

        //-------------------------------DI CONVERSION --------------------
        case POSTION_CODE.DefensiveTackle:
          dataobj = rawData as DefensiveTackleDto

          const convertedDataDI = {
            age: calculatedAge,
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
            age: calculatedAge,
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
          const cleanedResultDE = Object.keys(resultDE).reduce((acc, key) => {
            if (resultDE[key] !== null && resultDE[key] !== undefined) {
              acc[key] = resultDE[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultDE,
          }

        //------------------------------ LOLB CONVERSION ================
        case POSTION_CODE.LeftOutside_linebacker_below_245lbs:

          dataobj = rawData as LeftOutside_linebacker_below_245lbsDTO

          const convertedDataLOLBG = {
            age: calculatedAge,
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
          const resultLOLBG = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataLOLBG.speed,
            acceleration: convertedDataLOLBG.acceleration,
            agility: convertedDataLOLBG.agility,
            change_of_direction: convertedDataLOLBG.change_of_direction,
            awareness: convertedDataLOLBG.awareness,
            strength: convertedDataLOLBG.strength,
            jumping: convertedDataLOLBG.jumping,
            tackling: convertedDataLOLBG.tackling,
            hit_power: convertedDataLOLBG.hit_power,
            power_moves: convertedDataLOLBG.power_moves,
            finesse_moves: convertedDataLOLBG.finesse_moves,
            block_shedding: convertedDataLOLBG.block_shed,
            pursuit: convertedDataLOLBG.pursuit,
            play_recognition: convertedDataLOLBG.play_recognition
          });
          await this.playerAttrRepo.save(resultLOLBG)

          const cleanedResultLOLBG = Object.keys(resultLOLBG).reduce((acc, key) => {
            if (resultLOLBG[key] !== null && resultLOLBG[key] !== undefined) {
              acc[key] = resultLOLBG[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultLOLBG,
          };
        //------------------------------ ROLB CONVERSION ================
        case POSTION_CODE.RightOutside_linebacker_below_245lbs:

          dataobj = rawData as RightOutside_linebacker_below_245lbsDTO

          const convertedDataLOLBB = {
            age: calculatedAge,
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
          const resultLOLBB = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataLOLBB.speed,
            acceleration: convertedDataLOLBB.acceleration,
            agility: convertedDataLOLBB.agility,
            change_of_direction: convertedDataLOLBB.change_of_direction,
            awareness: convertedDataLOLBB.awareness,
            strength: convertedDataLOLBB.strength,
            jumping: convertedDataLOLBB.jumping,
            tackling: convertedDataLOLBB.tackling,
            hit_power: convertedDataLOLBB.hit_power,
            power_moves: convertedDataLOLBB.power_moves,
            finesse_moves: convertedDataLOLBB.finesse_moves,
            block_shedding: convertedDataLOLBB.block_shed,
            pursuit: convertedDataLOLBB.pursuit,
            play_recognition: convertedDataLOLBB.play_recognition
          });
          await this.playerAttrRepo.save(resultLOLBB)

          const cleanedResultLOLBB = Object.keys(resultLOLBB).reduce((acc, key) => {
            if (resultLOLBB[key] !== null && resultLOLBB[key] !== undefined) {
              acc[key] = resultLOLBB[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultLOLBB,
          };


        //------------------------------ MLB CONVERSION ================
        case POSTION_CODE.All_Middle_Linebackers:

          dataobj = rawData as All_Middle_LinebackersDTO

          const convertedDataMLB = {
            age: calculatedAge,
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
          const resultMLB = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataMLB.speed,
            acceleration: convertedDataMLB.acceleration,
            agility: convertedDataMLB.agility,
            change_of_direction: convertedDataMLB.change_of_direction,
            awareness: convertedDataMLB.awareness,
            strength: convertedDataMLB.strength,
            jumping: convertedDataMLB.jumping,
            tackling: convertedDataMLB.tackling,
            hit_power: convertedDataMLB.hit_power,
            power_moves: convertedDataMLB.power_moves,
            finesse_moves: convertedDataMLB.finesse_moves,
            block_shedding: convertedDataMLB.block_shed,
            pursuit: convertedDataMLB.pursuit,
            play_recognition: convertedDataMLB.play_recognition
          });
          await this.playerAttrRepo.save(resultMLB)

          const cleanedResultMLB = Object.keys(resultMLB).reduce((acc, key) => {
            if (resultMLB[key] !== null && resultMLB[key] !== undefined) {
              acc[key] = resultMLB[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultMLB,
          };

        //--FULLBACK CONVERSION
        //-- KICKER CONVERSION
        //-- PUNTER CONVERSION 

        //------------------------CB CONVERSION ------------------------------ 
        case POSTION_CODE.CornerBack:

          dataobj = rawData as CornerBackDto

          const convertedDataCB = {
            age: calculatedAge,
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
            player: { id: player.id },
            age: calculatedAge,
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

          const cleanedResultCB = Object.keys(resultCB).reduce((acc, key) => {
            if (resultCB[key] !== null && resultCB[key] !== undefined) {
              acc[key] = resultCB[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultCB,
          };


        //------------------S CONVERSION --------------------------
        case POSTION_CODE.Safety:

          dataobj = rawData as SafetyDto

          const convertedDataS = {
            age: calculatedAge,
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
            age: calculatedAge,
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

          const cleanedResultS = Object.keys(resultS).reduce((acc, key) => {
            if (resultS[key] !== null && resultS[key] !== undefined) {
              acc[key] = resultS[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultS,
          };
        case POSTION_CODE.Kicker:

          dataobj = rawData as KickerDto

          const convertedDataK = {
            age: calculatedAge,
            kick_power: dataobj.kick_power + 0,
            awareness: dataobj.awareness - 19,
            kick_accuracy: dataobj.kick_accuracy - 3,
            speed: dataobj.speed - 8,
            acceleration: dataobj.acceleration + 7,
          }
          const resultK = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            kick_power: convertedDataK.kick_power,
            awareness: convertedDataK.awareness,
            kick_accuracy: convertedDataK.kick_accuracy,
            speed: convertedDataK.speed,
            acceleration: convertedDataK.acceleration,
          })
          await this.playerAttrRepo.save(resultK)

          const cleanedResultK = Object.keys(convertedDataK).reduce((acc, key) => {
            if (resultK[key] !== null && resultK[key] !== undefined) {
              acc[key] = resultK[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultK,
          }
        case POSTION_CODE.Punter:

          dataobj = rawData as PunterDto

          const convertedDataP = {
            age: calculatedAge,
            kick_power: dataobj.kick_power + 0,
            awareness: dataobj.awareness - 21,
            kick_accuracy: dataobj.kick_accuracy - 3,
            speed: dataobj.speed - 7,
            acceleration: dataobj.acceleration - 7,
          }
          const resultP = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            kick_power: convertedDataP.kick_power,
            awareness: convertedDataP.awareness,
            kick_accuracy: convertedDataP.kick_accuracy,
            speed: convertedDataP.speed,
            acceleration: convertedDataP.acceleration,
          })
          await this.playerAttrRepo.save(resultP)

          const cleanedResultP = Object.keys(convertedDataP).reduce((acc, key) => {
            if (resultP[key] !== null && resultP[key] !== undefined) {
              acc[key] = resultP[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultP,
          }
        case POSTION_CODE.FullBack:

          dataobj = rawData as FullBackDto

          const convertedDataFB = {
            age: calculatedAge,
            speed: dataobj.speed + 5,
            acceleration: dataobj.acceleration - 4,
            agility: dataobj.agility + 3,
            stamina: dataobj.stamina - 1,
            change_of_direction: dataobj.change_of_direction + 1,
            lead_block: dataobj.lead_block - 8,
            run_block: dataobj.run_block - 12,
            pass_block: dataobj.pass_block - 15,
            pass_block_power: dataobj.pass_block_power - 6,
            run_block_power: dataobj.run_block_power - 1,
            pass_block_finesse: dataobj.pass_block_finesse - 8,
            run_block_finesse: dataobj.run_block_finesse - 4,
            carrying: dataobj.carrying - 7,
            catching: dataobj.catching - 1,
            catch_in_traffic: dataobj.catch_in_traffic + 19,
            short_route_running: dataobj.short_route_running - 10,
            medium_route_running: dataobj.medium_route_running - 10,
            injury: dataobj.injury - 1,
            strength: dataobj.strength + 4,
            impact_block: dataobj.impact_blocking - 4,
            stiff_arm: dataobj.stiff_arm + 8,
            trucking: dataobj.trucking - 1,
            awareness: dataobj.awareness - 3,
          }
          const ResultFB = this.playerAttrRepo.create({
            player: { id: player.id },
            age: calculatedAge,
            speed: convertedDataFB.speed,
            acceleration: convertedDataFB.acceleration,
            agility: convertedDataFB.agility,
            stamina: convertedDataFB.stamina,
            change_of_direction: convertedDataFB.change_of_direction,
            lead_block: convertedDataFB.lead_block,
            run_block: convertedDataFB.run_block,
            pass_block: convertedDataFB.pass_block,
            pass_block_power: convertedDataFB.pass_block_power,
            run_block_power: convertedDataFB.run_block_power,
            pass_block_finesse: convertedDataFB.pass_block_finesse,
            run_block_finesse: convertedDataFB.run_block_finesse,
            carrying: convertedDataFB.carrying,
            catching: convertedDataFB.catching,
            catch_in_traffic: convertedDataFB.catch_in_traffic,
            short_route_running: convertedDataFB.short_route_running,
            medium_route_running: convertedDataFB.medium_route_running,
            injury: convertedDataFB.injury,
            strength: convertedDataFB.strength,
            stiff_arm: convertedDataFB.stiff_arm,
            trucking: convertedDataFB.trucking,
            awareness: convertedDataFB.awareness,
          })
          await this.playerAttrRepo.save(ResultFB)

          const cleanedResultFB = Object.keys(convertedDataFB).reduce((acc, key) => {
            if (ResultFB[key] !== null && ResultFB[key] !== undefined) {
              acc[key] = ResultFB[key];
            }
            return acc;
          }, {});

          return {
            message: `Conversion of ${positionCode} Successful`,
            result: cleanedResultFB,
          }
        default:
          throw new Error('Invalid Position Code');

      }
    }
    catch (error) {
      throw new Error(error.message)
    }
  }
}