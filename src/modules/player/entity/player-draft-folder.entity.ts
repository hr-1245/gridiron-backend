import { baseEntity } from "src/entities/base.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { PlayerEntity } from "./players.entity";
import { userEntity } from "src/modules/user/entity/userEntity";

@Entity({ name: 'draft_folder' })
export class playerDraftFolderEntity extends baseEntity {
  @Column()
  name: string;

  @ManyToOne(() => userEntity, user => user.draftFolders)
  user: userEntity;

  @OneToMany(() => PlayerEntity, player => player.draftFolder)
  players: PlayerEntity[];
}