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
export class userManualConversionLimitGuard extends AuthGuard('jwt-user') {
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

    const BASIC_PLAN_LIMIT = 10;

    const userWithSubscription = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['subscription'],
    });

    console.log('👤 User subscription info:', userWithSubscription?.subscription);

    let isOnFreePlan = false;

    if (!userWithSubscription?.subscription) {
      // New user → free plan
      console.log('🆕 New user, no subscription.');
      isOnFreePlan = true;
    } else {
      // Check subscription validity
      const now = new Date();
      const validUntil = userWithSubscription.subscription.validUntil
        ? new Date(userWithSubscription.subscription.validUntil)
        : null;

      const isExpired = !validUntil || validUntil < now;
      const isNotActive =
        userWithSubscription.subscription.subscriptionStatus !== paymentStatus.SUCCEEDED;

      console.log('📅 Subscription validUntil:', validUntil);
      console.log('⏳ Expired:', isExpired);
      console.log('🚫 Not active:', isNotActive);

      if (isExpired || isNotActive) {
        console.log('⚠ Subscription expired/inactive → treating as free plan.');
        isOnFreePlan = true;
      }
    }

    if (isOnFreePlan) {
      const allPlayersCount = await this.playerRepo.count({
        where: { user: { id: user.id } },
      });

      console.log(`📊 Player count: ${allPlayersCount}/${BASIC_PLAN_LIMIT}`);

      if (allPlayersCount >= BASIC_PLAN_LIMIT) {
        if (!userWithSubscription?.subscription) {
          throw new ForbiddenException(
            'You have reached the maximum limit of 10 player conversions on the free plan. Please subscribe to convert more players.'
          );
        } else {
          throw new ForbiddenException(
            'Your subscription is expired/inactive. You can only add up to 10 players on the free plan.'
          );
        }
      }
    }

    return true;
  }


  // async canActivate(context: ExecutionContext): Promise<boolean> {
  //   console.log('🚀 [Guard] Starting canActivate check...');

  //   const canProceed = await super.canActivate(context);
  //   console.log('✅ [Guard] Passport AuthGuard result:', canProceed);

  //   if (!canProceed) {
  //     console.warn('❌ [Guard] Authentication failed at passport level.');
  //     return false;
  //   }

  //   const request = context.switchToHttp().getRequest();
  //   const user = request.user;
  //   console.log('👤 [Guard] Extracted user from request:', user);

  //   if (!user) {
  //     console.error('❌ [Guard] No user found in request.');
  //     throw new UnauthorizedException();
  //   }

  //   const userWithSubscription = await this.userRepo.findOne({
  //     where: { id: user.id },
  //     relations: ['subscription'],
  //   });

  //   console.log('📦 [Guard] User with subscription data:', userWithSubscription);

  //   const BASIC_PLAN_LIMIT = 10;

  //   console.log(
  //     '🔍 [Guard] No subscription:',
  //     !userWithSubscription?.subscription,
  //     '| Subscription expired/inactive:',
  //     this.isSubscriptionExpiredOrInactive(userWithSubscription?.subscription)
  //   );

  //   if (
  //     !userWithSubscription?.subscription ||
  //     this.isSubscriptionExpiredOrInactive(userWithSubscription.subscription)
  //   ) {
  //     console.log('⚠ [Guard] User has no active subscription. Checking player count...');

  //     const allPlayersCount = await this.playerRepo.count({
  //       where: {
  //         user: { id: user.id },
  //       },
  //     });

  //     console.log(`📊 [Guard] Player count for user ${user.id}:`, allPlayersCount);

  //     if (allPlayersCount >= BASIC_PLAN_LIMIT) {
  //       console.error(
  //         `❌ [Guard] Player conversion limit reached (${allPlayersCount}/${BASIC_PLAN_LIMIT}).`
  //       );
  //       throw new ForbiddenException(
  //         'You have reached the maximum limit of 10 player conversions on the free plan. Please subscribe to convert more players.'
  //       );
  //     } else {
  //       console.log(`✅ [Guard] Player count within limit (${allPlayersCount}/${BASIC_PLAN_LIMIT}).`);
  //     }
  //   } else {
  //     console.log('✅ [Guard] User has an active subscription. Proceeding...');
  //   }

  //   console.log('🎯 [Guard] canActivate passed. Allowing request.');
  //   return true;
  // }

  // private isSubscriptionExpiredOrInactive(subscription: any): boolean {
  //   if (!subscription) {
  //     console.warn('⚠ [Guard] Subscription object is missing.');
  //     return true;
  //   }

  //   const now = new Date();
  //   const validUntil = subscription.validUntilS
  //     ? new Date(subscription.validUntil)
  //     : null;

  //   const isExpired = !validUntil || validUntil < now;
  //   const isNotActive =
  //     subscription.subscriptionStatus !== paymentStatus.SUCCEEDED;

  //   console.log('📅 [Guard] Subscription validUntil:', validUntil);
  //   console.log('⏳ [Guard] Is expired:', isExpired);
  //   console.log('🚫 [Guard] Is not active:', isNotActive);

  //   return isExpired || isNotActive;
  // }
}
