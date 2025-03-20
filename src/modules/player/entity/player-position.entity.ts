import { Entity, Column, OneToMany } from 'typeorm';
import { baseEntity } from 'src/entities/base.entity';
import { PlayerEntity, PositionAttributeMappingEntity } from './players.entity';

@Entity({ name: 'player_position' })
export class PlayerPositionEntity extends baseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @OneToMany(() => PlayerEntity, player => player.position)
  players: PlayerEntity[];

  @OneToMany(() => PositionAttributeMappingEntity, mapping => mapping.position, { cascade: true })
  attributeMappings: PositionAttributeMappingEntity[];
}
