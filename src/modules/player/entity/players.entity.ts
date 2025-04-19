import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { PlayerPositionEntity } from './player-position.entity';
import { approvalStatusEnum, COLLAGE_AGE_ENUM, POSTION_CODE } from 'src/types/enums/roles';
import { baseEntity } from 'src/entities/base.entity';
import { userEntity } from 'src/modules/user/entity/user.entity';

@Entity({ name: 'player' })
export class PlayerEntity extends baseEntity {

    @Column({ nullable: false })
    name: string;

    @ManyToOne(() => userEntity, user => user.player, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    user: userEntity;

    @Column({ nullable: true })
    overallRating: number;

    @Column({ nullable: true })
    homeTown: string;

    @Column({ nullable: true, type: 'enum', enum: COLLAGE_AGE_ENUM })
    playerClass: COLLAGE_AGE_ENUM

    @Column({ nullable: true, type: 'text' })
    height: string | null

    @Column({ nullable: true, type: 'int' })
    weight: number | null

    @Column({ nullable: true })
    projectedReason?: string;

    @ManyToOne(() => PlayerPositionEntity, position => position.players, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    position: PlayerPositionEntity;

    @OneToMany(() => PlayerImageEntity, image => image.player, { cascade: true })
    images: PlayerImageEntity[];

    @OneToMany(() => PlayerAttributesEntity, attr => attr.player, { cascade: true })
    attributes: PlayerAttributesEntity[];

    @Column({ type: 'enum', enum: approvalStatusEnum })
    approvalStatus: approvalStatusEnum
}


@Entity({ name: 'player_attributes' })
export class PlayerAttributesEntity extends baseEntity {

    @Column({ nullable: true })
    age: number

    @Column({ nullable: true })
    speed: number; // 'SPD'

    @Column({ nullable: true })
    strength: number; // 'STR'

    @Column({ nullable: true })
    agility: number; // 'AGI'

    @Column({ nullable: true })
    acceleration: number; // 'ACC'

    @Column({ nullable: true })
    awareness: number; // 'AWR'

    @Column({ nullable: true })
    stamina: number; // 'STA'

    @Column({ nullable: true })
    injury: number; // 'INJ'

    @Column({ nullable: true })
    toughness: number; // 'TGH'

    // Additional position-specific attributes:
    @Column({ nullable: true })
    throw_power: number; // 'THP'

    @Column({ nullable: true })
    throw_accuracy_short: number; // 'THP'

    @Column({ nullable: true })
    throw_accuracy_mid: number; // 'THP'

    @Column({ nullable: true })
    throw_accuracy_deep: number; // 'THP'


    @Column({ nullable: true })
    short_accuracy: number; // 'SAC'

    @Column({ nullable: true })
    medium_accuracy: number; // 'MAC'

    @Column({ nullable: true })
    deep_accuracy: number; // 'DAC'

    @Column({ nullable: true })
    throw_on_the_run: number; // 'RUN'

    @Column({ nullable: true })
    throw_under_pressure: number; // 'TUP'

    @Column({ nullable: true })
    break_sack: number; // 'BSK'

    @Column({ nullable: true })
    play_action: number; // 'PAC'

    @Column({ nullable: true })
    break_tackle: number; // 'BTK'

    @Column({ nullable: true })
    trucking: number; // 'TRK'

    @Column({ nullable: true })
    change_of_direction: number; // 'COD'

    @Column({ nullable: true })
    ball_carrier_vision: number; // 'BCV'

    @Column({ nullable: true })
    stiff_arm: number; // 'SFA'

    @Column({ nullable: true })
    spin_move: number; // 'SPM'

    @Column({ nullable: true })
    kick_power: number; // 'SPM'

    @Column({ nullable: true })
    kick_accuracy: number; // 'SPM'

    @Column({ nullable: true })
    juke_move: number; // 'JKM'

    @Column({ nullable: true })
    carrying: number; // 'CAR'

    @Column({ nullable: true })
    catching: number; // 'CTH'

    @Column({ nullable: true })
    short_route_running: number; // 'SRR'

    @Column({ nullable: true })
    short_throw_acceleration: number

    @Column({ nullable: true })
    medium_throw_acceleration: number

    @Column({ nullable: true })
    deep_throw_acceleration: number

    @Column({ nullable: true })
    medium_route_running: number; // 'MRR'

    @Column({ nullable: true })
    deep_route_running: number; // 'DRR'

    @Column({ nullable: true })
    catch_in_traffic: number; // 'CIT'

    @Column({ nullable: true })
    spectacular_catch: number; // 'SPC'

    @Column({ nullable: true })
    release: number; // 'RLS'

    @Column({ nullable: true })
    jumping: number; // 'JMP'

    @Column({ nullable: true })
    return: number; // 'RET'

    @Column({ nullable: true })
    pass_block: number; // 'PBK'

    @Column({ nullable: true })
    pass_block_power: number; // 'PBP'

    @Column({ nullable: true })
    pass_block_finesse: number; // 'PBF'

    @Column({ nullable: true })
    run_block: number; // 'RBK'

    @Column({ nullable: true })
    run_block_power: number; // 'RBP'

    @Column({ nullable: true })
    run_block_finesse: number; // 'RBF'

    @Column({ nullable: true })
    lead_block: number; // 'LBK'

    @Column({ nullable: true })
    impact_block: number; // 'IBL'

    @Column({ nullable: true })
    tackling: number; // 'TAK'

    @Column({ nullable: true })
    hit_power: number; // 'POW'

    @Column({ nullable: true })
    power_moves: number; // 'PMV'

    @Column({ nullable: true })
    finesse_moves: number; // 'FMV'

    @Column({ nullable: true })
    block_shedding: number; // 'BSH'

    @Column({ nullable: true })
    pursuit: number; // 'PUR'

    @Column({ nullable: true })
    play_recognition: number; // 'PRC'

    @Column({ nullable: true })
    man_coverage: number; // 'MCV'

    @Column({ nullable: true })
    zone_coverage: number; // 'ZCV'

    @Column({ nullable: true })
    press: number; // 'PRS'

    // @Column('decimal', { nullable: true })
    // value: number;

    @Column({ nullable: true })
    draft_round: number

    @ManyToOne(() => PlayerEntity, player => player.attributes, { nullable: true, onDelete: 'CASCADE' })
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

    @Column({ nullable: true })
    displayOrder?: number;

    @ManyToOne(() => PlayerPositionEntity, position => position.attributeMappings)
    position: PlayerPositionEntity;
}