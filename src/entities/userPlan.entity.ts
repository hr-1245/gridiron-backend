import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { baseEntity } from "./base.entity";
import { subscriptionEnum, subscriptionStatus } from "src/types/enums/subscription";
import { userEntity } from "src/modules/user/entity/user.entity";

@Entity({ name: 'userPlan' })
export class userPlanEntity extends baseEntity {

  @Column()
  stripeSubscriptionId: string

  @Column({ type: 'enum', enum: subscriptionEnum, default: subscriptionEnum.TRIAL })
  planType: subscriptionEnum

  @Column({ type: 'enum', enum: subscriptionStatus, default: subscriptionStatus.TRIALING })
  subscriptionStatus: subscriptionStatus

  @OneToOne(() => userEntity, (user) => user.subscription)
  user: userEntity


}



