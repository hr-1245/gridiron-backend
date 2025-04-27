import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerEntity } from '../entity/players.entity';
import { Repository } from 'typeorm';
import { PaginatedPlayers } from 'src/types/enums/otp';
import { playerDraftFolderEntity } from '../entity/player-draft-folder.entity';



@Injectable()
export class PlayerDataService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(playerDraftFolderEntity)
    private readonly playerDraftRepo: Repository<playerDraftFolderEntity>,
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

      const message = totalCount === 0
        ? 'No converted players found'
        : 'Players retrieved successfully';

      return {
        message,
        data: cleanedPlayers,
        totalCount,
        totalPages,
      };

    } catch (error) {
      throw new Error('Error retrieving converted players');
    }
  }
  //--------------Delete a Player Card ---------------
  async deletePlayerCard(playerId: number, userId: number): Promise<{ message: string }> {
    try {
      const player = await this.playerRepo.findOne({
        where: { id: playerId, user: { id: userId } },
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

  async getUserDraftFolders(
    userId: number,
    searchId?: number,
    searchName?: string,
  ): Promise<playerDraftFolderEntity[]> {
    const query = this.playerDraftRepo.createQueryBuilder('draft')
      .leftJoinAndSelect('draft.players', 'players')
      .where('draft.user.id = :userId', { userId });

    if (searchId) {
      query.andWhere('draft.id = :searchId', { searchId });
    }

    if (searchName) {
      query.andWhere('draft.name ILIKE :searchName', { searchName: `%${searchName}%` });
    }

    query.orderBy('draft.createdAt', 'DESC');

    const draftFolders = await query.getMany();

    if (!draftFolders.length) {
      let errorMessage = 'No draft folders found';

      if (searchId) {
        errorMessage = `No draft folders found for the given ID: ${searchId}`;
      } else if (searchName) {
        errorMessage = `No draft folders found for the given name: "${searchName}"`;
      }

      throw new NotFoundException(errorMessage);
    }

    return draftFolders;
  }

  //--------------Update AND EDIT LATER -
}
