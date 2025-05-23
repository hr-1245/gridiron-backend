import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { PlayerPositionEntity } from './player-position.entity';
import { COLLAGE_AGE_ENUM, playerStatusEnum } from 'src/types/enums/roles';
import { baseEntity } from 'src/entities/base.entity';
import { userEntity } from 'src/modules/user/entity/userEntity';
import { playerDraftFolderEntity } from './player-draft-folder.entity';
import { Min, Max } from 'class-validator';

@Entity({ name: 'player' })
export class PlayerEntity extends baseEntity {
    @Column({ nullable: false })
    name: string;

    @ManyToOne(() => userEntity, user => user.player, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    user: userEntity;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    overallRating: number;

    @Column({ nullable: true })
    homeTown: string;

    @Column({ nullable: true, type: 'enum', enum: COLLAGE_AGE_ENUM })
    playerClass: COLLAGE_AGE_ENUM

    @Column({ nullable: true, type: 'text' })
    height: string | null

    @Column({ nullable: true, type: 'int' })
    @Min(0)
    weight: number | null

    @Column({ nullable: true })
    @Min(1)
    @Max(7)
    projectedReason?: string;

    @Column({ nullable: true })
    jerseyNumber?: string;

    @ManyToOne(() => PlayerPositionEntity, position => position.players, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    position: PlayerPositionEntity;

    @Column({ type: 'enum', enum: playerStatusEnum, default: playerStatusEnum.ISACTIVE })
    isActive: playerStatusEnum;

    @OneToMany(() => PlayerImageEntity, image => image.player, { cascade: true })
    images: PlayerImageEntity[];

    @OneToMany(() => PlayerAttributesEntity, attr => attr.player, { cascade: true })
    attributes: PlayerAttributesEntity[];

    @ManyToOne(() => playerDraftFolderEntity, folder => folder.players, { nullable: true })
    @JoinColumn()
    draftFolder: playerDraftFolderEntity
}

@Entity({ name: 'player_attributes' })
export class PlayerAttributesEntity extends baseEntity {
    @Column({ nullable: true })
    @Min(18)
    @Max(24)
    age: number

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    speed: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    strength: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    agility: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    acceleration: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    awareness: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    stamina: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    injury: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    toughness: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    throw_power: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    throw_accuracy_short: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    throw_accuracy_mid: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    throw_accuracy_deep: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    short_accuracy: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    medium_accuracy: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    deep_accuracy: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    throw_on_the_run: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    throw_under_pressure: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    break_sack: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    play_action: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    break_tackle: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    trucking: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    change_of_direction: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    ball_carrier_vision: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    stiff_arm: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    spin_move: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    kick_power: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    kick_accuracy: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    juke_move: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    carrying: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    catching: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    short_route_running: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    short_throw_acceleration: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    medium_throw_acceleration: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    deep_throw_acceleration: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    medium_route_running: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    deep_route_running: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    catch_in_traffic: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    spectacular_catch: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    release: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    jumping: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    return: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    pass_block: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    pass_block_power: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    pass_block_finesse: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    run_block: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    run_block_power: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    run_block_finesse: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    lead_block: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    impact_block: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    tackling: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    hit_power: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    power_moves: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    finesse_moves: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    block_shedding: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    pursuit: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    play_recognition: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    man_coverage: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    zone_coverage: number;

    @Column({ nullable: true })
    @Min(0)
    @Max(99)
    press: number;

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