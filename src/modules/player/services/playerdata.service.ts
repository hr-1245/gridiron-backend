import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerEntity } from '../entity/players.entity';
import { Brackets, ILike, IsNull, Not, Repository } from 'typeorm';
import { PaginatedPlayers } from 'src/types/enums/otp';
import { playerDraftFolderEntity } from '../entity/player-draft-folder.entity';
import { PlayerPositionEntity } from '../entity/player-position.entity';
import { playerStatusEnum, POSTION_CODE } from 'src/types/enums/roles';
import { userjwtInterface } from 'src/modules/jwt/interface/jwt.interface';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { userEntity } from 'src/modules/user/entity/userEntity';



@Injectable()
export class PlayerDataService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(playerDraftFolderEntity)
    private readonly playerDraftRepo: Repository<playerDraftFolderEntity>,

    @InjectRepository(PlayerPositionEntity)
    private readonly playerPosRepo: Repository<PlayerPositionEntity>,

    @InjectRepository(userEntity)
    private readonly UserPosRepo: Repository<userEntity>,
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
  ) {
    try {
      const query = this.playerRepo.createQueryBuilder('player')
        .leftJoinAndSelect('player.attributes', 'attributes')
        .leftJoinAndSelect('player.position', 'position')
        .where('player.userId = :userId', { userId })
        .andWhere('player.isActive = :isActive', { isActive: playerStatusEnum.ISACTIVE })
        .andWhere('attributes.id IS NOT NULL');

      if (searchValue) {
        query.andWhere(
          '(LOWER(player.name) LIKE :search OR LOWER(position.name) LIKE :search OR LOWER(position.code) LIKE :search)',
          { search: `%${searchValue.toLowerCase()}%` }
        );
      }

      if (positionCode) {
        query.andWhere('position.code = :positionCode', { positionCode });
      }

      const [players, totalCount] = await query
        .orderBy('player.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(totalCount / limit);

      const positionSummaryMap: Record<string, number> = {};
      for (const key in POSTION_CODE) {
        const code = POSTION_CODE[key as keyof typeof POSTION_CODE];
        positionSummaryMap[`${code.toLowerCase()}Count`] = 0;
      }

      for (const player of players) {
        if (player.position?.code) {
          const key = `${player.position.code.toLowerCase()}Count`;
          positionSummaryMap[key]++;
        }
      }

      const cleanedPlayers = players.map((player) => ({
        ...this.removeNulls(player),
        position: player.position ? this.removeNulls(player.position) : null,
        attributes: player.attributes?.map(attr => this.removeNulls(attr)) || [],
      }));

      return {
        message: cleanedPlayers.length === 0
          ? 'No converted players found'
          : 'Players retrieved successfully',
        data: cleanedPlayers,
        totalCount,
        totalPages,
        positionSummary: positionSummaryMap,
      };
    } catch (error) {
      console.error(error);
    }
  }




  //--------------Delete a Player Card ---------------

  async deletePlayerCard(playerId: number, userId: number): Promise<{ message: string }> {
    try {
      const player = await this.playerRepo.findOne({
        where: { id: playerId, user: { id: userId } },
      });

      if (!player) {
        throw new NotFoundException('Player not found');
      }

      player.isActive = playerStatusEnum.INACTIVE;
      await this.playerRepo.save(player);

      return {
        message: 'Player card has been successfully removed',
      };
    } catch (error) {
      throw error;
    }
  }

  // async deleteDraftFolder(draftId: number, userId: number) {
  //   const folder = await this.playerDraftRepo.findOne({
  //     where: {
  //       id: draftId,
  //       user: { id: userId },
  //     },
  //     relations: ['players'],
  //   });

  //   if (!folder) {
  //     throw new NotFoundException('Draft Folder Not Found');
  //   }

  //   if (folder.players && folder.players.length > 0) {
  //     await this.playerRepo.remove(folder.players);
  //   }

  //   await this.playerDraftRepo.remove(folder);

  //   return { message: 'Draft folder and associated players deleted successfully' };
  // }

  async getUserDraftFolders(
    userId: number,
    searchId?: number,
    searchName?: string,
  ): Promise<playerDraftFolderEntity[]> {
    try {
      const qb = this.playerDraftRepo.createQueryBuilder('folder')
        .leftJoinAndSelect('folder.players', 'player')
        .leftJoinAndSelect('player.position', 'position')
        .where('folder.userId = :userId', { userId });

      if (searchId) {
        qb.andWhere('folder.id = :searchId', { searchId });
      }

      if (searchName) {
        qb.andWhere(
          new Brackets(qb => {
            qb.where('folder.name ILIKE :search')
              .orWhere('player.name ILIKE :search')
              .orWhere('player.homeTown ILIKE :search')
              .orWhere('position.name ILIKE :search');
          }),
          { search: `%${searchName}%` },
        );
      }

      qb.orderBy('folder.createdAt', 'DESC');

      const data = await qb.getMany();

      // Filter out inactive players
      data.forEach(folder => {
        folder.players = folder.players.filter(player => player.isActive === playerStatusEnum.ISACTIVE);
      });

      return data;
    } catch (error) {
      throw new Error(`Error fetching draft folders: ${error.message}`);
    }
  }

  async getPlayerById(playerId: number): Promise<{ message: string; data: PlayerEntity }> {
    const player = await this.playerRepo.findOne({
      where: { id: playerId },
      relations: {
        position: true,
        attributes: true,
        draftFolder: true,
        images: true,
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return {
      message: 'Player retrieved successfully',
      data: player,
    };
  }


  async getDraftFolderById(id: number, user: userjwtInterface) {
    try {
      const draftFolder = await this.playerDraftRepo.findOne({
        where: { id, user: { id: user.id } },
        relations: {
          players: {
            position: true,
          },
        },
      });

      if (!draftFolder) throw new NotFoundException('Draft folder not found.');

      // Filter only active players
      draftFolder.players = draftFolder.players.filter(
        player => player.isActive === playerStatusEnum.ISACTIVE
      );

      return draftFolder;
    } catch (error) {
      throw new InternalServerErrorException('Draft folder not found');
    }
  }

  async UpdateProfile(data: UpdateProfileDto, user: userjwtInterface): Promise<{ message: string }> {
    try {
      const existingUser = await this.UserPosRepo.findOne({ where: { id: user.id } });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      if (data.fullName) {
        existingUser.fullName = data.fullName;
      }

      await this.UserPosRepo.save(existingUser);

      return {
        message: 'Profile updated successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to update profile');
    }
  }
}