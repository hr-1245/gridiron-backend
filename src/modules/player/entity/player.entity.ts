import { baseEntity } from 'src/entities/base.entity';
import { userEntity } from 'src/modules/user/entity/user.entity';
import { approvalStatusEnum } from 'src/types/enums/roles';
import { Column, OneToMany, ManyToOne, Entity, Table, ManyToMany, JoinColumn } from 'typeorm';

@Entity({ name: 'player' })
export class playerEntity extends baseEntity {

  @Column()
  name: string

  @ManyToOne(() => userEntity, (user) => user.player)
  user: userEntity

  @Column({ nullable: true })
  position: string

  @OneToMany(() => playerImageEntity, (image) => image.player, { cascade: true })
  images: playerImageEntity[]

  @OneToMany(() => playerAttributesEntity, (attribute) => attribute.player, { cascade: true })
  attributes: playerAttributesEntity[]

  @Column({ type: 'enum', enum: approvalStatusEnum, default: approvalStatusEnum.PENDING })
  approvalStatus: approvalStatusEnum
}

@Entity({ name: 'playerPosition' })
export class playerPositionsEntity extends baseEntity {

  @Column({ nullable: true })
  tight_end: string

  @Column({ nullable: true })
  quarter_back: string

  @Column({ nullable: true })
  running_back: string

  @Column({ nullable: true })
  wide_receiver: string

  @Column({ nullable: true })
  offensive_line: string

  @Column({ nullable: true })
  center: string

  @Column({ nullable: true })
  full_back: string

  @Column({ nullable: true })
  guard: string

  @Column({ nullable: true })
  tackle: string

  @Column({ nullable: true })
  defensive_end: string

  @Column({ nullable: true })
  linebacker: string

  @Column({ nullable: true })
  corner_back: string

  @Column({ nullable: true })
  safety: string

  @OneToMany(() => playerEntity, (player) => player.position)
  player: playerEntity[]

  @OneToMany(() => playerEntity, (attribute) => attribute.position, { cascade: true })
  attributes: playerAttributesEntity[];

}

@Entity({ name: 'playerAttributes' })
export class playerAttributesEntity extends baseEntity {

  @Column()
  overall_rating: string

  @Column({ nullable: true })
  speed: string

  @Column({ nullable: true })
  strength: string

  @Column({ nullable: true })
  agility: string

  @Column({ nullable: true })
  acceleration: string

  @Column({ nullable: true })
  awareness: string

  @Column({ nullable: true })
  stamina: string

  @Column({ nullable: true })
  injury: string

  @Column({ nullable: true })
  toughness: string

  @Column({ nullable: true })
  throw_power: string

  @Column({ nullable: true })
  short_accuray: string

  @Column({ nullable: true })
  medium_string: string

  @Column({ nullable: true })
  deep_accuracy: string

  @Column({ nullable: true })
  throw_on_the_run: string

  @Column({ nullable: true })
  throw_under_pressure: string

  @Column({ nullable: true })
  break_sack: string

  @Column({ nullable: true })
  play_action: string

  @Column({ nullable: true })
  break_tackle: string

  @Column({ nullable: true })
  trucking: string

  @Column({ nullable: true })
  change_of_direction: string

  @Column({ nullable: true })
  ball_carrier_vision: string

  @Column({ nullable: true })
  stiff_arm: string

  @Column({ nullable: true })
  spin_move: string

  @Column({ nullable: true })
  juke_move: string

  @Column({ nullable: true })
  carrying: string

  @Column({ nullable: true })
  catching: string

  @Column({ nullable: true })
  short_route_running: string

  @Column({ nullable: true })
  medium_short_running: string

  @Column({ nullable: true })
  deep_route_running: string

  @Column({ nullable: true })
  catch_in_traffic: string

  @Column({ nullable: true })
  spectacular_catch: string

  @Column({ nullable: true })
  release: string

  @Column({ nullable: true })
  jumping: string

  @Column({ nullable: true })
  return: string

  @Column({ nullable: true })
  pass_block: string

  @Column({ nullable: true })
  pass_block_power: string

  @Column({ nullable: true })
  pass_block_finesse: string

  @Column({ nullable: true })
  run_block: string

  @Column({ nullable: true })
  run_block_power: string

  @Column({ nullable: true })
  run_block_finesse: string

  @Column({ nullable: true })
  lead_block: string

  @Column({ nullable: true })
  impact_block: string

  @Column({ nullable: true })
  tackling: string

  @Column({ nullable: true })
  hit_power: string

  @Column({ nullable: true })
  power_moves: string

  @Column({ nullable: true })
  finesse_moves: string

  @Column({ nullable: true })
  block_shedding: string

  @Column({ nullable: true })
  pursuit: string

  @Column({ nullable: true })
  play_recognition: string

  @Column({ nullable: true })
  man_coverage: string

  @Column({ nullable: true })
  zone_coverage: string

  @Column({ nullable: true })
  press: string

  @Column('decimal')
  value: number

  @ManyToOne(() => playerEntity, (player) => player.attributes)
  player: playerEntity

}
@Entity({ name: 'playerImage' })
export class playerImageEntity extends baseEntity {

  @Column()
  url: string

  @ManyToOne(() => playerEntity, (player) => player.images)
  player: playerEntity
}

