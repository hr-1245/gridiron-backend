import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerEntity, PlayerAttributesEntity } from '../entity/players.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import { PositionAttributeMappingEntity } from '../entity/players.entity';
import { Repository } from 'typeorm';

@Injectable()
export class playerDataService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,

    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,

    @InjectRepository(PlayerPositionEntity)
    private readonly playerPosRepo: Repository<PlayerPositionEntity>,

    @InjectRepository(PositionAttributeMappingEntity)
    private readonly playerAttrMappRepo: Repository<PositionAttributeMappingEntity>,
  ) { }

  // Helper function to remove null or undefined properties from an object.
  private removeNulls<T extends Record<string, any>>(obj: T): Partial<T> {
    const newObj: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        newObj[key] = value;
      }
    });
    return newObj;
  }

  /**
   * Get all converted players for the given user (i.e. players with non-empty attributes)
   * with pagination and optional name search.
   */
  async getAllConvertedPlayers(
    userId: number,
    page: number = 1,
    limit: number = 10,
    searchValue?: string,
  ): Promise<any> {
    try {
      const query = this.playerRepo
        .createQueryBuilder('player')
        .leftJoinAndSelect('player.attributes', 'attributes')
        .leftJoinAndSelect('player.position', 'position')
        .where('attributes.id IS NOT NULL')
        // Only include players of the authenticated user:
        .andWhere('player.user.id = :userId', { userId });

      if (searchValue) {
        query.andWhere('player.name ILIKE :search', { search: `%${searchValue}%` });
      }

      query.orderBy('player.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [players, total] = await query.getManyAndCount();

      // Remove null properties from player and each of its attributes
      const cleanedPlayers = players.map(player => ({
        ...this.removeNulls(player),
        attributes: player.attributes.map(attr => this.removeNulls(attr)),
        position: this.removeNulls(player.position),
      }));

      return {
        data: cleanedPlayers,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving players');
    }
  }

  /**
   * Get converted players by name (search by partial match) for the authenticated user.
   */
  async getConvertedPlayerByName(
    userId: number,
    search: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    try {
      const query = this.playerRepo
        .createQueryBuilder('player')
        .leftJoinAndSelect('player.attributes', 'attributes')
        .leftJoinAndSelect('player.position', 'position')
        .where('player.name ILIKE :search', { search: `%${search}%` })
        .andWhere('attributes.id IS NOT NULL')
        .andWhere('player.user.id = :userId', { userId })
        .orderBy('player.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [players, total] = await query.getManyAndCount();
      const cleanedPlayers = players.map(player => ({
        ...this.removeNulls(player),
        attributes: player.attributes.map(attr => this.removeNulls(attr)),
        position: this.removeNulls(player.position),
      }));

      return {
        data: cleanedPlayers,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving players by name');
    }
  }

  /**
   * Get converted players by position code for the authenticated user.
   */
  async getConvertedPlayerByPosition(
    userId: number,
    positionCode: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    try {
      const query = this.playerRepo
        .createQueryBuilder('player')
        .leftJoinAndSelect('player.attributes', 'attributes')
        .leftJoinAndSelect('player.position', 'position')
        .where('position.code = :positionCode', { positionCode })
        .andWhere('attributes.id IS NOT NULL')
        .andWhere('player.user.id = :userId', { userId })
        .orderBy('player.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [players, total] = await query.getManyAndCount();
      const cleanedPlayers = players.map(player => ({
        ...this.removeNulls(player),
        attributes: player.attributes.map(attr => this.removeNulls(attr)),
        position: this.removeNulls(player.position),
      }));

      return {
        data: cleanedPlayers,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving players by position');
    }
  }
}
