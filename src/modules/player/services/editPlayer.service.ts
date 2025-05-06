import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EditDto } from "../dto/edit.dto";
import { PlayerEntity, PlayerAttributesEntity } from "../entity/players.entity";
import { playerDraftFolderEntity } from "../entity/player-draft-folder.entity";
import { POSTION_CODE, CollageAgeMapping, COLLAGE_AGE_ENUM } from "src/types/enums/roles";
import { All_Middle_LinebackersDTO, CornerBackDto, DefensiveTackleDto, FullBackDto, KickerDto, Left_Outside_linebacker_above_245_lbsDTO, LeftEndDTO, LeftGaurdDto, LeftOutside_linebacker_below_245lbsDTO, LeftTackleDto, PunterDto, QuarterBackDto, Right_Outside_linebacker_above_245lbsDTO, RightEndDTO, RightGaurdDto, RightOutside_linebacker_below_245lbsDTO, RightTackleDto, RunningBackDto, SafetyDto, TightEndDto, WideReceiverDto } from "../dto/convert-manually.dto";

@Injectable()
export class editPlayerService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,

    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,

    @InjectRepository(playerDraftFolderEntity)
    private readonly draftFolderRepo: Repository<playerDraftFolderEntity>
  ) { }

  private safeNumber(value: number | undefined, defaultValue: number = 0): number {
    if (value === undefined || isNaN(value)) return defaultValue;
    return value;
  }
  private filterNullValues(obj: any): any {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined
      ))
  }

  private calculateAttribute(
    baseValue: number | undefined,
    modifier: number,
    draftRound: number | undefined = 0,
    minValue: number = 0,
    maxValue: number = 99
  ): number {
    const safeBase = this.safeNumber(baseValue);
    const safeDraftRound = this.safeNumber(draftRound);
    const calculated = safeBase + modifier - safeDraftRound;

    return Math.max(minValue, Math.min(maxValue, calculated));
  }

  async editPlayer(playerId: number, userId: number, dto: EditDto): Promise<any> {
    const {
      draft_round,
      data: rawData,
      ovr,
      height,
      weight,
      homeTown,
      jerseyNumber,
      player_class,
      draftFolderName
    } = dto;

    const player = await this.playerRepo.findOne({
      where: { id: playerId, user: { id: userId } },
      relations: ['draftFolder', 'attributes', 'position']
    });

    if (!player) throw new NotFoundException("Player not found");

    let latestAttr = player.attributes?.[player.attributes.length - 1];
    if (!latestAttr) {
      throw new BadRequestException("Player has no attributes to edit");
    }

    // Update player bio
    if (ovr !== undefined) player.overallRating = ovr;
    if (height !== undefined) player.height = height;
    if (weight !== undefined) player.weight = weight;
    if (homeTown !== undefined) player.homeTown = homeTown;
    if (jerseyNumber !== undefined) player.jerseyNumber = jerseyNumber.toString();
    if (player_class !== undefined) player.playerClass = player_class as COLLAGE_AGE_ENUM;

    if (draftFolderName && draftFolderName !== player.draftFolder?.name) {
      let folder = await this.draftFolderRepo.findOne({
        where: { name: draftFolderName, user: { id: userId } }
      });

      if (!folder) {
        folder = this.draftFolderRepo.create({ name: draftFolderName, user: { id: userId } });
        folder = await this.draftFolderRepo.save(folder);
      }

      player.draftFolder = folder;
    }

    await this.playerRepo.save(player);

    let calculatedAge: number;

    if (player_class !== undefined) {
      const collegeYearKey = rawData?.age as unknown as COLLAGE_AGE_ENUM;
      const collegeYearAge = CollageAgeMapping?.[collegeYearKey];

      if (collegeYearAge === undefined) {
        throw new BadRequestException(`Invalid or missing college year (age) value: ${collegeYearKey}`);
      }

      calculatedAge = Math.floor(Math.random() * 2) + 17 + collegeYearAge;
    } else {
      calculatedAge = latestAttr.age; // fallback to previous age
    }

    const positionCode = player.position.code;
    let convertedAttributes: Record<string, any> = { age: calculatedAge };

    if (rawData) {
      switch (positionCode) {
        // Tight End
        case POSTION_CODE.TightEnd: {
          const dataobj = rawData as TightEndDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, 0),
            acceleration: this.calculateAttribute(dataobj.acceleration, 2),
            agility: this.calculateAttribute(dataobj.agility, 1),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, 3),
            strength: this.calculateAttribute(dataobj.strength, -3),
            awareness: this.calculateAttribute(dataobj.awareness, -4, draft_round),
            break_tackle: this.calculateAttribute(dataobj.break_tackle, -2, draft_round),
            catch_in_traffic: this.calculateAttribute(dataobj.catch_in_traffic, -1, draft_round),
            spectacular_catch: this.calculateAttribute(dataobj.spectacular_catch, 0, draft_round),
            release: this.calculateAttribute(dataobj.release, 2, draft_round),
            pass_block: this.calculateAttribute(dataobj.pass_block, -14, draft_round),
            pass_block_power: this.calculateAttribute(dataobj.pass_block_power, -14, draft_round),
            pass_block_finesse: this.calculateAttribute(dataobj.pass_block_finesse, -10, draft_round),
            run_block: this.calculateAttribute(dataobj.run_block, -11, draft_round),
            run_block_power: this.calculateAttribute(dataobj.run_block_power, -12, draft_round),
            run_block_finesse: this.calculateAttribute(dataobj.run_block_finesse, -16, draft_round),
            lead_block: this.calculateAttribute(dataobj.lead_blocking, -4, draft_round),
            impact_block: this.calculateAttribute(dataobj.impact_blocking, 7, draft_round),
            jumping: this.calculateAttribute(dataobj.jumping, 3),
            carrying: this.calculateAttribute(dataobj.carrying, -1, draft_round),
            trucking: this.calculateAttribute(dataobj.trucking, 0, draft_round),
            catching: this.calculateAttribute(dataobj.catching, 0, draft_round),
            stiff_arm: this.calculateAttribute(dataobj.stiff_arm, 0, draft_round),
            spin_move: this.calculateAttribute(dataobj.spin_move, -1, draft_round),
            juke_move: this.calculateAttribute(dataobj.juke_move, -1, draft_round),
            short_route_running: this.calculateAttribute(dataobj.short_route_running, -12, draft_round),
            medium_route_running: this.calculateAttribute(dataobj.medium_route_running, -13, draft_round),
            deep_route_running: this.calculateAttribute(dataobj.deep_route_running, -6, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Quarterback
        case POSTION_CODE.QuarterBack: {
          const dataobj = rawData as QuarterBackDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -2),
            acceleration: this.calculateAttribute(dataobj.acceleration, -2),
            agility: this.calculateAttribute(dataobj.agility, -5),
            awareness: this.calculateAttribute(dataobj.awareness, -10, draft_round),
            throw_power: this.calculateAttribute(dataobj.throw_power, -1),
            throw_accuracy_short: this.calculateAttribute(dataobj.throw_accuracy_short, -7, draft_round),
            throw_accuracy_mid: this.calculateAttribute(dataobj.throw_accuracy_mid, -10, draft_round),
            throw_accuracy_deep: this.calculateAttribute(dataobj.throw_accuracy_deep, -14, draft_round),
            throw_on_the_run: this.calculateAttribute(dataobj.throw_on_the_run, -8, draft_round),
            throw_under_pressure: this.calculateAttribute(dataobj.throw_under_pressure, -11, draft_round),
            play_action: this.calculateAttribute(dataobj.play_action, -15, draft_round),
            break_sack: this.calculateAttribute(dataobj.break_sack, -9, draft_round),
            break_tackle: this.calculateAttribute(dataobj.break_tackle, -4, draft_round),
            trucking: this.calculateAttribute(dataobj.trucking, -13, draft_round),
            carrying: this.calculateAttribute(dataobj.carrying, -26, draft_round),
            ball_carrier_vision: this.calculateAttribute(dataobj.ball_carrier_vision, -13, draft_round),
            stiff_arm: this.calculateAttribute(dataobj.stiff_arm, -7, draft_round),
            spin_move: this.calculateAttribute(dataobj.spin_move, -14, draft_round),
            juke_move: this.calculateAttribute(dataobj.juke_move, -10, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -2),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Running Back
        case POSTION_CODE.RunningBack: {
          const dataobj = rawData as RunningBackDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -2),
            acceleration: this.calculateAttribute(dataobj.acceleration, 0),
            agility: this.calculateAttribute(dataobj.agility, -4),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, -4),
            strength: this.calculateAttribute(dataobj.strength, -3),
            awareness: this.calculateAttribute(dataobj.awareness, -11, draft_round),
            break_tackle: this.calculateAttribute(dataobj.break_tackle, -7, draft_round),
            carrying: this.calculateAttribute(dataobj.carrying, -5, draft_round),
            trucking: this.calculateAttribute(dataobj.trucking, -7, draft_round),
            ball_carrier_vision: this.calculateAttribute(dataobj.ball_carrier_vision, -14, draft_round),
            catching: this.calculateAttribute(dataobj.catching, -14, draft_round),
            stiff_arm: this.calculateAttribute(dataobj.stiff_arm, -3, draft_round),
            spin_move: this.calculateAttribute(dataobj.spin_move, -8, draft_round),
            juke_move: this.calculateAttribute(dataobj.juke_move, -8, draft_round),
            pass_block: this.calculateAttribute(dataobj.pass_blocking, -24, draft_round),
            catch_in_traffic: this.calculateAttribute(dataobj.catch_in_traffic, -19, draft_round),
            spectacular_catch: this.calculateAttribute(dataobj.spectacular_catch, -12, draft_round),
            short_route_running: this.calculateAttribute(dataobj.short_route_running, -16, draft_round),
            medium_route_running: this.calculateAttribute(dataobj.short_route_running, -16, draft_round),
            release: this.calculateAttribute(dataobj.release, -7, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -2),
            return: this.calculateAttribute(dataobj.return, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Wide Receiver
        case POSTION_CODE.WiderReceiver: {
          const dataobj = rawData as WideReceiverDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -2),
            acceleration: this.calculateAttribute(dataobj.acceleration, 0),
            agility: this.calculateAttribute(dataobj.agility, 0),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, -1),
            strength: this.calculateAttribute(dataobj.strength, -9),
            awareness: this.calculateAttribute(dataobj.awareness, -15, draft_round),
            break_tackle: this.calculateAttribute(dataobj.break_tackle, -3, draft_round),
            catch_in_traffic: this.calculateAttribute(dataobj.catch_in_traffic, -10, draft_round),
            spectacular_catch: this.calculateAttribute(dataobj.spectacular_catch, -5, draft_round),
            release: this.calculateAttribute(dataobj.release, -13, draft_round),
            jumping: this.calculateAttribute(dataobj.jumping, -3),
            carrying: this.calculateAttribute(dataobj.carrying, -14, draft_round),
            trucking: this.calculateAttribute(dataobj.trucking, -21, draft_round),
            ball_carrier_vision: this.calculateAttribute(dataobj.ball_carrier_vision, -15, draft_round),
            catching: this.calculateAttribute(dataobj.catching, -9, draft_round),
            stiff_arm: this.calculateAttribute(dataobj.stiff_arm, -7, draft_round),
            spin_move: this.calculateAttribute(dataobj.spin_move, -5, draft_round),
            juke_move: this.calculateAttribute(dataobj.juke_move, -3, draft_round),
            short_route_running: this.calculateAttribute(dataobj.short_route_running, -11, draft_round),
            medium_route_running: this.calculateAttribute(dataobj.medium_route_running, -16, draft_round),
            deep_route_running: this.calculateAttribute(dataobj.deep_route_running, -17, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            return: this.calculateAttribute(dataobj.return, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Defensive Tackle
        case POSTION_CODE.DefensiveTackle: {
          const dataobj = rawData as DefensiveTackleDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -1),
            acceleration: this.calculateAttribute(dataobj.acceleration, 0),
            agility: this.calculateAttribute(dataobj.agility, -5),
            awareness: this.calculateAttribute(dataobj.awareness, -13, draft_round),
            strength: this.calculateAttribute(dataobj.strength, 0),
            tackling: this.calculateAttribute(dataobj.tackling, -11, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -11),
            power_moves: this.calculateAttribute(dataobj.power_moves, -8, draft_round),
            finesse_moves: this.calculateAttribute(dataobj.finesse_moves, -9, draft_round),
            block_shedding: this.calculateAttribute(dataobj.block_shedding, -10, draft_round),
            pursuit: this.calculateAttribute(dataobj.pursuit, -15, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -18, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -3),
            injury: this.calculateAttribute(dataobj.injury, -2),
            draft_round: draft_round
          };
          break;
        }

        // Cornerback
        case POSTION_CODE.CornerBack: {
          const dataobj = rawData as CornerBackDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -4),
            acceleration: this.calculateAttribute(dataobj.acceleration, 0),
            agility: this.calculateAttribute(dataobj.agility, 0),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, -2),
            catching: this.calculateAttribute(dataobj.catching, -19, draft_round),
            awareness: this.calculateAttribute(dataobj.awareness, -7, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -8),
            jumping: this.calculateAttribute(dataobj.jumping, -1),
            tackling: this.calculateAttribute(dataobj.tackling, -8, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -10),
            pursuit: this.calculateAttribute(dataobj.pursuit, -13, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -15, draft_round),
            man_coverage: this.calculateAttribute(dataobj.man_coverage, -13, draft_round),
            zone_coverage: this.calculateAttribute(dataobj.zone_coverage, -13, draft_round),
            press: this.calculateAttribute(dataobj.press, -10, draft_round),
            return: this.calculateAttribute(dataobj.return, 0),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Safety
        case POSTION_CODE.Safety: {
          const dataobj = rawData as SafetyDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -1),
            acceleration: this.calculateAttribute(dataobj.acceleration, -1),
            agility: this.calculateAttribute(dataobj.agility, 1),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, -9),
            catching: this.calculateAttribute(dataobj.catching, -22, draft_round),
            awareness: this.calculateAttribute(dataobj.awareness, -8, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -11),
            block_shed: this.calculateAttribute(dataobj.block_shed, -8, draft_round),
            jumping: this.calculateAttribute(dataobj.jumping, -6),
            tackling: this.calculateAttribute(dataobj.tackling, -7, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -8),
            pursuit: this.calculateAttribute(dataobj.pursuit, -11, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -18, draft_round),
            man_coverage: this.calculateAttribute(dataobj.man_coverage, -6, draft_round),
            zone_coverage: this.calculateAttribute(dataobj.zone_coverage, -15, draft_round),
            press: this.calculateAttribute(dataobj.press, -6, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Left Guard
        case POSTION_CODE.LeftGuard: {
          const dataobj = rawData as LeftGaurdDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, 0),
            acceleration: this.calculateAttribute(dataobj.acceleration, -3),
            awareness: this.calculateAttribute(dataobj.awareness, -9, draft_round),
            agility: this.calculateAttribute(dataobj.agility, -12),
            lead_block: this.calculateAttribute(dataobj.lead_block, -8, draft_round),
            impact_block: this.calculateAttribute(dataobj.impact_blocking, -3, draft_round),
            run_block: this.calculateAttribute(dataobj.run_blocking, -16, draft_round),
            pass_block: this.calculateAttribute(dataobj.pass_blocking, -12, draft_round),
            pass_block_power: this.calculateAttribute(dataobj.pass_block_power, -15, draft_round),
            pass_block_finesse: this.calculateAttribute(dataobj.pass_block_finesse, -16, draft_round),
            run_block_power: this.calculateAttribute(dataobj.run_block_power, -16, draft_round),
            run_block_finesse: this.calculateAttribute(dataobj.run_block_finesse, -16, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Right Guard
        case POSTION_CODE.RightGuard: {
          const dataobj = rawData as RightGaurdDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, 0),
            acceleration: this.calculateAttribute(dataobj.acceleration, -3),
            awareness: this.calculateAttribute(dataobj.awareness, -9, draft_round),
            agility: this.calculateAttribute(dataobj.agility, -12),
            lead_block: this.calculateAttribute(dataobj.lead_block, -8, draft_round),
            impact_block: this.calculateAttribute(dataobj.impact_blocking, -3, draft_round),
            run_block: this.calculateAttribute(dataobj.run_blocking, -16, draft_round),
            pass_block: this.calculateAttribute(dataobj.pass_blocking, -12, draft_round),
            pass_block_power: this.calculateAttribute(dataobj.pass_block_power, -15, draft_round),
            pass_block_finesse: this.calculateAttribute(dataobj.pass_block_finesse, -16, draft_round),
            run_block_power: this.calculateAttribute(dataobj.run_block_power, -16, draft_round),
            run_block_finesse: this.calculateAttribute(dataobj.run_block_finesse, -16, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Left Tackle
        case POSTION_CODE.LeftTackle: {
          const dataobj = rawData as LeftTackleDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -5),
            acceleration: this.calculateAttribute(dataobj.acceleration, -5),
            awareness: this.calculateAttribute(dataobj.awareness, -10, draft_round),
            agility: this.calculateAttribute(dataobj.agility, -5),
            strength: this.calculateAttribute(dataobj.strength, -2),
            lead_block: this.calculateAttribute(dataobj.lead_block, -5, draft_round),
            impact_block: this.calculateAttribute(dataobj.impact_block, -5, draft_round),
            run_block: this.calculateAttribute(dataobj.run_block, -5, draft_round),
            pass_block: this.calculateAttribute(dataobj.pass_block, -5, draft_round),
            pass_block_power: this.calculateAttribute(dataobj.pass_block_power, -5, draft_round),
            pass_block_finesse: this.calculateAttribute(dataobj.pass_block_finesse, -5, draft_round),
            run_block_power: this.calculateAttribute(dataobj.run_block_power, -5, draft_round),
            run_block_finesse: this.calculateAttribute(dataobj.run_block_finesse, -5, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Right Tackle
        case POSTION_CODE.RightTackle: {
          const dataobj = rawData as RightTackleDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -6),
            acceleration: this.calculateAttribute(dataobj.acceleration, -5),
            awareness: this.calculateAttribute(dataobj.awareness, -8, draft_round),
            agility: this.calculateAttribute(dataobj.agility, -13),
            strength: this.calculateAttribute(dataobj.strength, 1),
            lead_block: this.calculateAttribute(dataobj.lead_block, -9, draft_round),
            impact_block: this.calculateAttribute(dataobj.impact_block, -6, draft_round),
            run_block: this.calculateAttribute(dataobj.run_block, -15, draft_round),
            pass_block: this.calculateAttribute(dataobj.pass_block, -13, draft_round),
            pass_block_finesse: this.calculateAttribute(dataobj.pass_block_finesse, -14, draft_round),
            run_block_power: this.calculateAttribute(dataobj.run_block_power, -18, draft_round),
            run_block_finesse: this.calculateAttribute(dataobj.run_block_finesse, -14, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Left End
        case POSTION_CODE.LeftEnd: {
          const dataobj = rawData as LeftEndDTO;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -4),
            acceleration: this.calculateAttribute(dataobj.acceleration, -2),
            agility: this.calculateAttribute(dataobj.agility, -14),
            awareness: this.calculateAttribute(dataobj.awareness, -15, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -2),
            tackling: this.calculateAttribute(dataobj.tackling, -13, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -6),
            power_moves: this.calculateAttribute(dataobj.power_moves, -13, draft_round),
            finesse_moves: this.calculateAttribute(dataobj.finesse_moves, -8, draft_round),
            block_shed: this.calculateAttribute(dataobj.block_shed, -16, draft_round),
            pursuit: this.calculateAttribute(dataobj.pursuit, -16, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -24, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Right End
        case POSTION_CODE.RightEnd: {
          const dataobj = rawData as RightEndDTO;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -4),
            acceleration: this.calculateAttribute(dataobj.acceleration, -2),
            agility: this.calculateAttribute(dataobj.agility, -14),
            awareness: this.calculateAttribute(dataobj.awareness, -15, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -2),
            tackling: this.calculateAttribute(dataobj.tackling, -13, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -6),
            power_moves: this.calculateAttribute(dataobj.power_moves, -13, draft_round),
            finesse_moves: this.calculateAttribute(dataobj.finesse_moves, -8, draft_round),
            block_shed: this.calculateAttribute(dataobj.block_shed, -16, draft_round),
            pursuit: this.calculateAttribute(dataobj.pursuit, -16, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -24, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Left Outside Linebacker (above 245 lbs)
        case POSTION_CODE.LeftOutside_linebacker_above_245_lbs: {
          const dataobj = rawData as Left_Outside_linebacker_above_245_lbsDTO;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -4),
            acceleration: this.calculateAttribute(dataobj.acceleration, -2),
            agility: this.calculateAttribute(dataobj.agility, -14),
            awareness: this.calculateAttribute(dataobj.awareness, -15, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -2),
            tackling: this.calculateAttribute(dataobj.tackling, -13, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -6),
            power_moves: this.calculateAttribute(dataobj.power_moves, -13, draft_round),
            finesse_moves: this.calculateAttribute(dataobj.finesse_moves, -8, draft_round),
            block_shed: this.calculateAttribute(dataobj.block_shed, -16, draft_round),
            pursuit: this.calculateAttribute(dataobj.pursuit, -16, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -24, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Right Outside Linebacker (above 245 lbs)
        case POSTION_CODE.RightOutside_linebacker_above_245lbs: {
          const dataobj = rawData as Right_Outside_linebacker_above_245lbsDTO;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -4),
            acceleration: this.calculateAttribute(dataobj.acceleration, -2),
            agility: this.calculateAttribute(dataobj.agility, -14),
            awareness: this.calculateAttribute(dataobj.awareness, -15, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -2),
            tackling: this.calculateAttribute(dataobj.tackling, -13, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -6),
            power_moves: this.calculateAttribute(dataobj.power_moves, -13, draft_round),
            finesse_moves: this.calculateAttribute(dataobj.finesse_moves, -8, draft_round),
            block_shed: this.calculateAttribute(dataobj.block_shed, -16, draft_round),
            pursuit: this.calculateAttribute(dataobj.pursuit, -16, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -24, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Left Outside Linebacker (below 245 lbs)
        case POSTION_CODE.LeftOutside_linebacker_below_245lbs: {
          const dataobj = rawData as LeftOutside_linebacker_below_245lbsDTO;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -4),
            acceleration: this.calculateAttribute(dataobj.acceleration, -2),
            agility: this.calculateAttribute(dataobj.agility, -2),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, -4),
            awareness: this.calculateAttribute(dataobj.awareness, -9, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -7),
            jumping: this.calculateAttribute(dataobj.jumping, -12),
            tackling: this.calculateAttribute(dataobj.tackling, -7, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -3),
            power_moves: this.calculateAttribute(dataobj.power_moves, -21, draft_round),
            finesse_moves: this.calculateAttribute(dataobj.finesse_moves, -25, draft_round),
            block_shedding: this.calculateAttribute(dataobj.block_shedding, -6, draft_round),
            pursuit: this.calculateAttribute(dataobj.pursuit, -6, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -18, draft_round),
            man_coverage: this.calculateAttribute(dataobj.man_coverage, -25, draft_round),
            zone_coverage: this.calculateAttribute(dataobj.zone_coverage, -22, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Right Outside Linebacker (below 245 lbs)
        case POSTION_CODE.RightOutside_linebacker_below_245lbs: {
          const dataobj = rawData as RightOutside_linebacker_below_245lbsDTO;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -4),
            acceleration: this.calculateAttribute(dataobj.acceleration, -2),
            agility: this.calculateAttribute(dataobj.agility, -2),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, -4),
            awareness: this.calculateAttribute(dataobj.awareness, -9, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -7),
            jumping: this.calculateAttribute(dataobj.jumping, -12),
            tackling: this.calculateAttribute(dataobj.tackling, -7, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -3),
            power_moves: this.calculateAttribute(dataobj.power_moves, -21, draft_round),
            finesse_moves: this.calculateAttribute(dataobj.finesse_moves, -25, draft_round),
            block_shedding: this.calculateAttribute(dataobj.block_shedding, -6, draft_round),
            pursuit: this.calculateAttribute(dataobj.pursuit, -6, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -18, draft_round),
            man_coverage: this.calculateAttribute(dataobj.man_coverage, -25, draft_round),
            zone_coverage: this.calculateAttribute(dataobj.zone_coverage, -22, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Middle Linebacker
        case POSTION_CODE.All_Middle_Linebackers: {
          const dataobj = rawData as All_Middle_LinebackersDTO;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, -4),
            acceleration: this.calculateAttribute(dataobj.acceleration, -2),
            agility: this.calculateAttribute(dataobj.agility, -2),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, -4),
            awareness: this.calculateAttribute(dataobj.awareness, -9, draft_round),
            strength: this.calculateAttribute(dataobj.strength, -7),
            jumping: this.calculateAttribute(dataobj.jumping, -12),
            tackling: this.calculateAttribute(dataobj.tackling, -7, draft_round),
            hit_power: this.calculateAttribute(dataobj.hit_power, -3),
            power_moves: this.calculateAttribute(dataobj.power_moves, -21, draft_round),
            finesse_moves: this.calculateAttribute(dataobj.finesse_moves, -25, draft_round),
            block_shedding: this.calculateAttribute(dataobj.block_shedding, -6, draft_round),
            pursuit: this.calculateAttribute(dataobj.pursuit, -6, draft_round),
            play_recognition: this.calculateAttribute(dataobj.play_recognition, -18, draft_round),
            man_coverage: this.calculateAttribute(dataobj.man_coverage, -25, draft_round),
            zone_coverage: this.calculateAttribute(dataobj.zone_coverage, -22, draft_round),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            injury: this.calculateAttribute(dataobj.injury, -1),
            draft_round: draft_round
          };
          break;
        }

        // Kicker
        case POSTION_CODE.Kicker: {
          const dataobj = rawData as KickerDto;
          convertedAttributes = {
            ...convertedAttributes,
            kick_power: this.calculateAttribute(dataobj.kick_power, 0),
            awareness: this.calculateAttribute(dataobj.awareness, -19),
            kick_accuracy: this.calculateAttribute(dataobj.kick_accuracy, -3),
            speed: this.calculateAttribute(dataobj.speed, -8),
            acceleration: this.calculateAttribute(dataobj.acceleration, 7),
            draft_round: draft_round
          };
          break;
        }

        // Punter
        case POSTION_CODE.Punter: {
          const dataobj = rawData as PunterDto;
          convertedAttributes = {
            ...convertedAttributes,
            kick_power: this.calculateAttribute(dataobj.kick_power, 0),
            awareness: this.calculateAttribute(dataobj.awareness, -21),
            kick_accuracy: this.calculateAttribute(dataobj.kick_accuracy, -3),
            speed: this.calculateAttribute(dataobj.speed, -7),
            acceleration: this.calculateAttribute(dataobj.acceleration, -7),
            draft_round: draft_round
          };
          break;
        }

        // Fullback
        case POSTION_CODE.FullBack: {
          const dataobj = rawData as FullBackDto;
          convertedAttributes = {
            ...convertedAttributes,
            speed: this.calculateAttribute(dataobj.speed, 5),
            acceleration: this.calculateAttribute(dataobj.acceleration, -4),
            agility: this.calculateAttribute(dataobj.agility, 3),
            stamina: this.calculateAttribute(dataobj.stamina, -1),
            change_of_direction: this.calculateAttribute(dataobj.change_of_direction, 1),
            lead_block: this.calculateAttribute(dataobj.lead_block, -8),
            run_block: this.calculateAttribute(dataobj.run_block, -12),
            pass_block: this.calculateAttribute(dataobj.pass_block, -15),
            pass_block_power: this.calculateAttribute(dataobj.pass_block_power, -6),
            run_block_power: this.calculateAttribute(dataobj.run_block_power, -1),
            pass_block_finesse: this.calculateAttribute(dataobj.pass_block_finesse, -8),
            run_block_finesse: this.calculateAttribute(dataobj.run_block_finesse, -4),
            carrying: this.calculateAttribute(dataobj.carrying, -7),
            catching: this.calculateAttribute(dataobj.catching, -1),
            catch_in_traffic: this.calculateAttribute(dataobj.catch_in_traffic, 19),
            short_route_running: this.calculateAttribute(dataobj.short_route_running, -10),
            medium_route_running: this.calculateAttribute(dataobj.medium_route_running, -10),
            injury: this.calculateAttribute(dataobj.injury, -1),
            strength: this.calculateAttribute(dataobj.strength, 4),
            impact_block: this.calculateAttribute(dataobj.impact_blocking, -4),
            stiff_arm: this.calculateAttribute(dataobj.stiff_arm, 8),
            trucking: this.calculateAttribute(dataobj.trucking, -1),
            awareness: this.calculateAttribute(dataobj.awareness, -3),
            draft_round: draft_round
          };
          break;
        }

        default:
          throw new BadRequestException('Unsupported or unrecognized position code.');
      }
    }

    // Only update attributes that were actually provided in the DTO
    for (const [key, value] of Object.entries(convertedAttributes)) {
      if (value !== undefined && !isNaN(value)) {
        latestAttr[key] = value;
      }
    }

    await this.playerAttrRepo.save(latestAttr);

    return {
      message: `${positionCode} player updated successfully`,
      updatedPlayer: {
        id: player.id,
        name: player.name,
        positionCode: player.position.code,
        updatedAttributes: this.filterNullValues({
          ...this.filterNullValues(latestAttr),
          draft_round: draft_round
        }),
        bio: this.filterNullValues({
          ovr: player.overallRating,
          height: player.height,
          weight: player.weight,
          homeTown: player.homeTown,
          jerseyNumber: player.jerseyNumber,
          player_class: player.playerClass,
          draftFolderName: player.draftFolder?.name
        })
      }
    }
  }
}