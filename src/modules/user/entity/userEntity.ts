import { baseEntity } from 'src/entities/base.entity';
import { otpEntity } from 'src/modules/otp/entity/otp.entity';
import { PlayerEntity } from 'src/modules/player/entity/players.entity';
import { rolesEnum } from 'src/types/enums/roles';
import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { userPlanEntity } from './userPlan.entity';
import { playerDraftFolderEntity } from 'src/modules/player/entity/player-draft-folder.entity';


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
  otp: otpEntity[];

  @Column({ nullable: true })
  paymentMethodId: string;

  @OneToMany(() => PlayerEntity, (player) => player.user)
  player: PlayerEntity[];

  @OneToMany(() => playerDraftFolderEntity, folder => folder.user)
  draftFolders: playerDraftFolderEntity[];
}
