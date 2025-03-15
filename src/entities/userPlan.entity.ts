import {
  Entity,
  Column,
  OneToOne,
} from "typeorm";
import { baseEntity } from "./base.entity";
import { paymentStatus, subscriptionEnum } from "src/types/enums/subscription";
import { userEntity } from "src/modules/user/entity/user.entity";

@Entity({ name: 'userPlan' })
export class userPlanEntity extends baseEntity {

  @Column()
  stripeSubscriptionId: string

  @Column({ type: 'enum', enum: subscriptionEnum, default: subscriptionEnum.BASIC })
  planType: subscriptionEnum

  @Column({ type: 'enum', enum: paymentStatus, default: paymentStatus.PENDING })
  subscriptionStatus: paymentStatus

  @OneToOne(() => userEntity, (user) => user.subscription)
  user: userEntity

}



