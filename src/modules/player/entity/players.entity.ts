import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { PlayerPositionEntity } from './player-position.entity';
import { approvalStatusEnum } from 'src/types/enums/roles';
import { baseEntity } from 'src/entities/base.entity';
import { userEntity } from 'src/modules/user/entity/user.entity';

@Entity({ name: 'player' })
export class PlayerEntity extends baseEntity {
    @Column()
    name: string;

    @ManyToOne(() => userEntity, user => user.player)
    user: userEntity;

    @ManyToOne(() => PlayerPositionEntity, position => position.players, { nullable: true })
    position: PlayerPositionEntity;

    @OneToMany(() => PlayerImageEntity, image => image.player, { cascade: true })
    images: PlayerImageEntity[];

    @OneToMany(() => PlayerAttributesEntity, attr => attr.player, { cascade: true })
    attributes: PlayerAttributesEntity[];

    @Column({ type: 'enum', enum: approvalStatusEnum, default: approvalStatusEnum.PENDING })
    approvalStatus: approvalStatusEnum;
}


@Entity({ name: 'player_attributes' })
export class PlayerAttributesEntity extends baseEntity {
    @Column()
    overallRating: string;

    @Column({ nullable: true })
    speed: string; // 'SPD'

    @Column({ nullable: true })
    strength: string; // 'STR'

    @Column({ nullable: true })
    agility: string; // 'AGI'

    @Column({ nullable: true })
    acceleration: string; // 'ACC'

    @Column({ nullable: true })
    awareness: string; // 'AWR'

    @Column({ nullable: true })
    stamina: string; // 'STA'

    @Column({ nullable: true })
    injury: string; // 'INJ'

    @Column({ nullable: true })
    toughness: string; // 'TGH'

    // Additional position-specific attributes:
    @Column({ nullable: true })
    throw_power: string; // 'THP'

    @Column({ nullable: true })
    short_accuracy: string; // 'SAC'

    @Column({ nullable: true })
    medium_accuracy: string; // 'MAC'

    @Column({ nullable: true })
    deep_accuracy: string; // 'DAC'

    @Column({ nullable: true })
    throw_on_the_run: string; // 'RUN'

    @Column({ nullable: true })
    throw_under_pressure: string; // 'TUP'

    @Column({ nullable: true })
    break_sack: string; // 'BSK'

    @Column({ nullable: true })
    play_action: string; // 'PAC'

    @Column({ nullable: true })
    break_tackle: string; // 'BTK'

    @Column({ nullable: true })
    trucking: string; // 'TRK'

    @Column({ nullable: true })
    change_of_direction: string; // 'COD'

    @Column({ nullable: true })
    ball_carrier_vision: string; // 'BCV'

    @Column({ nullable: true })
    stiff_arm: string; // 'SFA'

    @Column({ nullable: true })
    spin_move: string; // 'SPM'

    @Column({ nullable: true })
    juke_move: string; // 'JKM'

    @Column({ nullable: true })
    carrying: string; // 'CAR'

    @Column({ nullable: true })
    catching: string; // 'CTH'

    @Column({ nullable: true })
    short_route_running: string; // 'SRR'

    @Column({ nullable: true })
    short_throw_acceleration: string

    @Column({ nullable: true })
    medium_throw_acceleration: string

    @Column({ nullable: true })
    deep_throw_acceleration: string

    @Column({ nullable: true })
    medium_route_running: string; // 'MRR'

    @Column({ nullable: true })
    deep_route_running: string; // 'DRR'

    @Column({ nullable: true })
    catch_in_traffic: string; // 'CIT'

    @Column({ nullable: true })
    spectacular_catch: string; // 'SPC'

    @Column({ nullable: true })
    release: string; // 'RLS'

    @Column({ nullable: true })
    jumping: string; // 'JMP'

    @Column({ nullable: true })
    return: string; // 'RET'

    @Column({ nullable: true })
    pass_block: string; // 'PBK'

    @Column({ nullable: true })
    pass_block_power: string; // 'PBP'

    @Column({ nullable: true })
    pass_block_finesse: string; // 'PBF'

    @Column({ nullable: true })
    run_block: string; // 'RBK'

    @Column({ nullable: true })
    run_block_power: string; // 'RBP'

    @Column({ nullable: true })
    run_block_finesse: string; // 'RBF'

    @Column({ nullable: true })
    lead_block: string; // 'LBK'

    @Column({ nullable: true })
    impact_block: string; // 'IBL'

    @Column({ nullable: true })
    tackling: string; // 'TAK'

    @Column({ nullable: true })
    hit_power: string; // 'POW'

    @Column({ nullable: true })
    power_moves: string; // 'PMV'

    @Column({ nullable: true })
    finesse_moves: string; // 'FMV'

    @Column({ nullable: true })
    block_shedding: string; // 'BSH'

    @Column({ nullable: true })
    pursuit: string; // 'PUR'

    @Column({ nullable: true })
    play_recognition: string; // 'PRC'

    @Column({ nullable: true })
    man_coverage: string; // 'MCV'

    @Column({ nullable: true })
    zone_coverage: string; // 'ZCV'

    @Column({ nullable: true })
    press: string; // 'PRS'

    @Column('decimal')
    value: number;

    @ManyToOne(() => PlayerEntity, player => player.attributes)
    player: PlayerEntity;
}



@Entity({ name: 'player_image' })
export class PlayerImageEntity extends baseEntity {
    @Column()
    url: string;

    @ManyToOne(() => PlayerEntity, player => player.images)
    player: PlayerEntity;
}


@Entity({ name: 'position_attribute_mapping' })
export class PositionAttributeMappingEntity extends baseEntity {

    @Column()
    attributeKey: string;

    @Column({ type: 'text', nullable: true })
    conversionLogic?: string;

    @Column({ nullable: true })
    displayOrder?: number;

    @ManyToOne(() => PlayerPositionEntity, position => position.attributeMappings)
    position: PlayerPositionEntity;
}