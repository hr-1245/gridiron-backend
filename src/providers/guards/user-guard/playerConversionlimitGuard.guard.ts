import {
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { userEntity } from 'src/modules/user/entity/userEntity';
import { PlayerEntity } from 'src/modules/player/entity/players.entity';
import { paymentStatus } from 'src/types/enums/subscription';

@Injectable()
export class userOcrConversionLimitGuard extends AuthGuard('jwt-user') {
  constructor(
    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canProceed = await super.canActivate(context);
    if (!canProceed) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new UnauthorizedException();

    const userWithSubscription = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['subscription'],
    });

    console.log('User with subscription:', userWithSubscription);

    const BASIC_PLAN_LIMIT = 5;
    if (!userWithSubscription?.subscription || this.isSubscriptionExpiredOrInactive(userWithSubscription.subscription)) {
      const convertedPlayersCount = await this.playerRepo.count({
        where: { user: { id: user.id } },
      });

      console.log('Converted players count:', convertedPlayersCount); // Add logging here

      if (convertedPlayersCount >= BASIC_PLAN_LIMIT) {
        throw new ForbiddenException(
          'You have reached the maximum limit of 5 player conversions on the free plan. Please subscribe to convert more players.'
        );
      }

      return true;
    }

    return true;
  }


  private isSubscriptionExpiredOrInactive(subscription: any): boolean {
    const now = new Date();
    const isExpired = !subscription.validUntil || new Date(subscription.validUntil) < now;
    const isNotActive = subscription.subscriptionStatus !== paymentStatus.SUCCEEDED;

    return isExpired || isNotActive;
  }
}
