import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { userEntity } from 'src/modules/user/entity/user.entity';
import { subscriptionEnum } from 'src/types/enums/subscription';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class userSubscriptionGuard extends AuthGuard('jwt-user') {  // Changed from 'jwt-subscription-user' to 'jwt-user'
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, execute the base JWT guard
    const canProceed = await super.canActivate(context);
    if (!canProceed) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    // Fetch the user with subscription details
    const userWithSubscription = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['subscription'],
    });

    if (!userWithSubscription || !userWithSubscription.subscription) {
      throw new ForbiddenException('You must have an active subscription.');
    }

    const { planType } = userWithSubscription.subscription;
    if (planType !== subscriptionEnum.REGULAR) {
      throw new ForbiddenException('You must have a valid subscription.');
    }

    return true;
  }
}
