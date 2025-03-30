import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerEntity, PlayerAttributesEntity } from '../entity/players.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import { Repository } from 'typeorm';

export interface PaginatedPlayers {
  data: any[];
  totalCount: number;
  totalPages: number;
}

@Injectable()
export class PlayerDataService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,

    @InjectRepository(PlayerAttributesEntity)
    private readonly playerAttrRepo: Repository<PlayerAttributesEntity>,

    @InjectRepository(PlayerPositionEntity)
    private readonly playerPosRepo: Repository<PlayerPositionEntity>,
  ) { }

  private removeNulls<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }

  //-----------------GET CONVERTED PLAYERS -------------------------------
  async getConvertedPlayers(
    userId: number,
    page: number = 1,
    limit: number = 10,
    searchValue?: string,
    positionCode?: string,
  ): Promise<PaginatedPlayers> {
    try {
      let query = this.playerRepo
        .createQueryBuilder('player')
        .leftJoinAndSelect('player.attributes', 'attributes')
        .leftJoinAndSelect('player.position', 'position')
        .where('attributes.id IS NOT NULL')
        .andWhere('player.user.id = :userId', { userId });

      if (searchValue) {
        query = query.andWhere('player.name ILIKE :search', { search: `%${searchValue}%` });
      }

      if (positionCode) {
        query = query.andWhere('position.code = :positionCode', { positionCode });
      }

      query = query.orderBy('player.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [players, totalCount] = await query.getManyAndCount();
      const totalPages = Math.ceil(totalCount / limit);

      const cleanedPlayers = players.map(player => ({
        ...this.removeNulls(player),
        position: player.position ? this.removeNulls(player.position) : null,
        attributes: player.attributes?.map(attr => this.removeNulls(attr)) || [],

      }));

      return {
        data: cleanedPlayers,
        totalCount,
        totalPages,
      };
    } catch (error) {
      console.error('Error retrieving converted players:', error);
      throw new InternalServerErrorException('Error retrieving converted players');
    }
  }
  //--------------Delete a Player Card ---------------
  async deletePlayerCard(playerId: number, userId: number): Promise<{ message: string }> {
    try {
      const player = await this.playerRepo.findOne({
        where: { id: playerId, user: { id: userId }   }, 
      });
      if (!player) {
        throw new Error('Player not found or you do not have permission to delete this player');
      }
      await this.playerRepo.remove(player);
      return {
        message: 'Player card deleted successfully'
      };
    } catch (error) {
      throw new InternalServerErrorException('Player not Found');
    }
  }
}
