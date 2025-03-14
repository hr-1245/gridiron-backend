import { baseEntity } from 'src/entities/base.entity';
import { userEntity } from 'src/modules/user/entity/user.entity';
import { approvalStatusEnum, generalAttributesEnum, positionsEnum } from 'src/types/enums/roles';
import { Column, OneToMany, ManyToOne, Entity } from 'typeorm';

@Entity({ name: 'player' })
export class playerEntity extends baseEntity {

  @Column()
  name: string

  @ManyToOne(() => userEntity, (user) => user.player)
  user: userEntity

  @Column({ type: 'enum', enum: positionsEnum })
  position: positionsEnum

  @OneToMany(() => playerImageEntity, (image) => image.player, { cascade: true })
  images: playerImageEntity[]

  @OneToMany(() => playerAttributesEntity, (attribute) => attribute.player, { cascade: true })
  attributes: playerAttributesEntity[]

  @Column({ type: 'enum', enum: approvalStatusEnum, default: approvalStatusEnum.PENDING })
  approvalStatus: approvalStatusEnum

}
@Entity({ name: 'playerPosition' })
export class playerPositionsEntity extends baseEntity {

  @Column({ type: 'enum', enum: positionsEnum, unique: true })
  name: positionsEnum

  @OneToMany(() => playerEntity, (player) => player.position)
  player: playerEntity[]

  @OneToMany(() => playerEntity, (attribute) => attribute.position, { cascade: true })
  attributes: playerAttributesEntity[];


}

@Entity({ name: 'playerAttributes' })
export class playerAttributesEntity extends baseEntity {

  @Column({ type: 'enum', enum: generalAttributesEnum, unique: true })
  name: generalAttributesEnum

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