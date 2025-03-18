import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { baseEntity } from 'src/entities/base.entity';
import { rolesEnum } from 'src/types/enums/roles';
import { playerEntity } from 'src/modules/player/entity/player.entity';
import { userPlanEntity } from './userPlan.entity';
import { otpEntity } from 'src/modules/otp/entity/otp.entity';

@Entity({ name: 'user' })
export class userEntity extends baseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: rolesEnum, default: rolesEnum.USER })
  role: rolesEnum;

  @Column({ default: false })
  isVerified: boolean; 

  @OneToOne(() => userPlanEntity, (subscription) => subscription.user, { cascade: true })
  @JoinColumn()
  subscription: userPlanEntity;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @OneToMany(() => otpEntity, (otp) => otp.user)
  otp: otpEntity[]

  @Column({ nullable: true })
  paymentMethodId: string;

  @OneToMany(() => playerEntity, (player) => player.user)
  player: playerEntity[];
}


