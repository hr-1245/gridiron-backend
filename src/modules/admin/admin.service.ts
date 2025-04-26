import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { userEntity } from '../user/entity/user.entity';
import { subscriptionEnum } from 'src/types/enums/subscription';

@Injectable()
export class adminService {
  private readonly logger = new Logger(adminService.name);

  constructor(
    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>,
  ) { }

  async getAllSubscribedUsers(
    page: number = 1,
    limit: number = 10,
    searchValue?: string,
    planType?: subscriptionEnum,
  ): Promise<{
    message: string;
    data: any[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const query = this.userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.subscription', 'subscription')
        .where('subscription.subscriptionStatus = :status', {
          status: 'succeeded',
        });

      if (searchValue) {
        query.andWhere('user.email ILIKE :search', {
          search: `%${searchValue}%`,
        });
      }

      if (planType) {
        query.andWhere('subscription.planType = :planType', { planType });
      }

      query
        .orderBy('user.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [users, totalCount] = await query.getManyAndCount();
      const totalPages = Math.ceil(totalCount / limit);

      const cleanedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        subscription: {
          planType: user.subscription?.planType,
          validUntil: user.subscription?.validUntil,
          subscriptionStatus: user.subscription?.subscriptionStatus,
          appliedDiscountName: user.subscription?.appliedDiscountName,
        },
      }));

      const message =
        totalCount === 0
          ? 'No subscribed users found'
          : 'Subscribed users retrieved successfully';

      return {
        message,
        data: cleanedUsers,
        totalCount,
        totalPages,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve subscribed users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Something went wrong while retrieving subscribed users.',
      );
    }
  }
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    searchValue?: string
  ): Promise<{
    message: string;
    data: any[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const query = this.userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.subscription', 'subscription');

      if (searchValue) {
        query.andWhere('user.email ILIKE :search', { search: `%${searchValue}%` });
      }

      const [users, totalCount] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(totalCount / limit);

      const cleanedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        role: user.role,
        subscription: user.subscription
          ? {
            planType: user.subscription.planType,
            validUntil: user.subscription.validUntil,
            subscriptionStatus: user.subscription.subscriptionStatus,
            appliedDiscountName: user.subscription.appliedDiscountName,
          }
          : null,
      }));

      const message =
        totalCount === 0 ? 'No users found' : 'Users retrieved successfully';

      return {
        message,
        data: cleanedUsers,
        totalCount,
        totalPages,
      };
    } catch (error: any) {
      this.logger.error(`Failed to retrieve users: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error retrieving users');
    }
  }

}



