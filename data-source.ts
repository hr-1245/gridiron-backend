import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PlayerAttributesEntity, PlayerEntity, PlayerImageEntity, PositionAttributeMappingEntity } from './src/modules/player/entity/players.entity';
import { userEntity } from 'src/modules/user/entity/userEntity';
import { userPlanEntity } from 'src/modules/user/entity/userPlan.entity';
import { otpEntity } from 'src/modules/otp/entity/otp.entity';
import { SeedPlayerPositionsAndMappings20250318121000 } from 'src/entities/migrations/playerpositionmapping';
import { PlayerPositionEntity } from 'src/modules/player/entity/player-position.entity';
import { playerDraftFolderEntity } from 'src/modules/player/entity/player-draft-folder.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'gridirongc-db1.cn6myq0impoz.us-west-2.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mushi1264273',
  database: process.env.DB_DATABASE || 'postgres',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    userEntity,
    userPlanEntity,
    playerDraftFolderEntity,
    PlayerEntity,
    PlayerPositionEntity,
    PlayerAttributesEntity,
    PlayerImageEntity,
    PositionAttributeMappingEntity,
    otpEntity,
    SeedPlayerPositionsAndMappings20250318121000
  ],
  migrations: [__dirname + '/src/entities/migrations/*.ts'],
  ssl: {
    rejectUnauthorized: false
  }
});
