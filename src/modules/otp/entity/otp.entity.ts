import { Entity, Column, ManyToOne } from 'typeorm';
import { baseEntity } from 'src/entities/base.entity';
import { userEntity } from 'src/modules/user/entity/user.entity';
import { OTP_REASON_ENUM } from 'src/types/enums/otp';

@Entity({ name: 'otp' })
export class otpEntity extends baseEntity {
  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'int' })
  otp: number;

  @Column({ type: 'varchar', enum: OTP_REASON_ENUM })
  type: OTP_REASON_ENUM;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @Column({ type: 'boolean', default: false })
  is_expired: boolean;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ManyToOne(() => userEntity, (user) => user.otp)
  user: userEntity;
}
