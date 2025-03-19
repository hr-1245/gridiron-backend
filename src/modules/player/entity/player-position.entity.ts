import { Entity, Column, OneToMany } from 'typeorm';
import { baseEntity } from 'src/entities/base.entity';
import { PlayerEntity, PositionAttributeMappingEntity } from './players.entity';

@Entity({ name: 'player_position' })
export class PlayerPositionEntity extends baseEntity {
  // A unique code (e.g., 'QB', 'RB') for internal use.
  @Column({ unique: true })
  code: string;

  // A user-friendly name (e.g., 'Quarterback', 'Running Back').
  @Column()
  name: string;

  // One position can be assigned to many players.
  @OneToMany(() => PlayerEntity, player => player.position)
  players: PlayerEntity[];

  // One position has multiple attribute mappings (conversion rules).
  @OneToMany(() => PositionAttributeMappingEntity, mapping => mapping.position, { cascade: true })
  attributeMappings: PositionAttributeMappingEntity[];
}
