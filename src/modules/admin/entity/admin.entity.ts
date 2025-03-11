import { ApiProperty } from "@nestjs/swagger";
import { baseEntity } from "src/entities/base.entity";
import { rolesEnum } from "src/utils/roles";
import { Column, Entity } from "typeorm";

@Entity({ name: 'adminAuth' })
export class adminauthEntity extends baseEntity {

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column()
  password: string;

  @Column({ type: 'enum', enum: rolesEnum, default: rolesEnum.admin })
  role: rolesEnum

}