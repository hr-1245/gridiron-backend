import { baseEntity } from "src/entities/base.entity";
import { userPlanEntity } from "src/entities/userPlan.entity";
import { playerEntity } from "src/modules/player/entity/player.entity";
import { rolesEnum } from "src/types/enums/roles";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, } from "typeorm";

@Entity({ name: 'user' })
export class userEntity extends baseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: rolesEnum, default: rolesEnum.USER })
  role: rolesEnum;

  @OneToOne(() => userPlanEntity, (subscription) => subscription.user, { cascade: true })
  @JoinColumn()
  subscription: userPlanEntity

  @Column({ nullable: true })
  stripeCustomerId: string

  @OneToMany(() => playerEntity, (player) => player.user)
  player: playerEntity[]
}

