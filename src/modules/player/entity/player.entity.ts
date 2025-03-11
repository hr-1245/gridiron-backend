import { baseEntity } from "src/entities/base.entity";
import { rolesEnum } from "src/utils/roles";
import { Column, Entity } from "typeorm";

@Entity({ name: 'playerAuth' })
export class playerauthEntity extends baseEntity {

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column({ type: 'enum', enum: rolesEnum, default: rolesEnum.player })
  role: rolesEnum



}