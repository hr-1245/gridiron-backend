import { baseEntity } from "src/entities/base.entity";
import { playerEntity } from "src/modules/player/entity/player.entity";
import { rolesEnum } from "src/utils/roles";
import { subscriptionEnum } from "src/utils/subscription";
import { Column, Entity, OneToMany, } from "typeorm";

@Entity({ name: 'user' })
export class userEntity extends baseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: rolesEnum, default: rolesEnum.user })
  role: rolesEnum;

  @Column({ type: 'enum', enum: subscriptionEnum, default: subscriptionEnum.trial })
  subscriptionType: subscriptionEnum

  @Column()
  currency: string

  @Column()
  paymentIntentId: string

  @OneToMany(() => playerEntity, (player) => player.user)
  player: playerEntity[]
}

//   @Column({ type: 'enum', enum: approvalStatusEnum, default: approvalStatusEnum.pending })
//   approvalStatus: approvalStatusEnum;

//   @OneToMany(() => userpositionEntity, (position) => position.player, { cascade: true, onDelete: 'CASCADE' })
//   positions: userpositionEntity[];

//   @OneToMany(() => userImageEntity, (image) => image.player, { cascade: true, onDelete: 'CASCADE' })
//   uploads: userImageEntity[];
// }

// @Entity({ name: 'user_positions' })
// export class userpositionEntity extends baseEntity {
//   @Column({ type: 'enum', enum: positionsEnum })
//   position: positionsEnum;

//   @OneToOne(() => userauthEntity, (player) => player.positions, { onDelete: 'CASCADE' })
//   player: userauthEntity;

//   @OneToMany(() => userPositionAttributesEntity, (attribute) => attribute.position, { cascade: true, onDelete: 'CASCADE' })
//   attributes: userPositionAttributesEntity[];
// }
// @Entity({ name: 'user_attributes' })
// export class userPositionAttributesEntity extends baseEntity {
//   @Column({ type: 'enum', enum: generalAttributesEnum })
//   attribute: generalAttributesEnum;

//   @Column()
//   value: number;

//   @ManyToOne(() => userpositionEntity, (position) => position.attributes, { onDelete: 'CASCADE' })
//   position: userpositionEntity;
// }


// @Entity({ name: 'user_images' })
// export class userImageEntity extends baseEntity {
//   @Column()
//   url: string;

//   @ManyToOne(() => userauthEntity, (user) => user.uploads, { onDelete: 'CASCADE' })
//   player: userauthEntity;
// }