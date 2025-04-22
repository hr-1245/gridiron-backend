import { paymentStatus, subscriptionEnum } from "src/types/enums/subscription"
import { Column, Entity, OneToOne } from "typeorm"
import { userEntity } from "./user.entity"
import { baseEntity } from "src/entities/base.entity"

@Entity({ name: 'userPlan' })
export class userPlanEntity extends baseEntity {
  @Column()
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: subscriptionEnum, default: subscriptionEnum.BASIC })
  planType: subscriptionEnum;

  @Column({ type: 'enum', enum: paymentStatus, default: paymentStatus.PENDING })
  subscriptionStatus: paymentStatus;

  @OneToOne(() => userEntity, (user) => user.subscription)
  user: userEntity;

  @Column({ nullable: true })
  appliedDiscountId: number;

  @Column({ type: 'float', nullable: true })
  appliedDiscountPercentage: number;

  @Column({ nullable: true })
  appliedDiscountName: string;
}

@Entity({ name: 'discount_config' })
export class discountConfigEntity extends baseEntity {
  @Column({ type: 'float', default: 0 })
  percentage: number;

  @Column({ nullable: true })
  name: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: number;
}