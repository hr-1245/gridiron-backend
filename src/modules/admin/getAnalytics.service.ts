import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { userPlanEntity } from "../user/entity/userPlan.entity";
import { userEntity } from '../user/entity/userEntity';
import { paymentStatus, REDIS_KEYS } from "src/types/enums/subscription";
import { redisService } from "../redis/redis.service";
import Stripe from "stripe";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class getAnalyticsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(userPlanEntity)
    private readonly userPlanRepo: Repository<userPlanEntity>,

    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>,

    private readonly redisAction: redisService,
    private readonly configService: ConfigService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
  }

  async execute() {
    try {
      const cacheExists = await this.redisAction.exists(REDIS_KEYS.ANALYTICS);

      if (cacheExists) {
        const cachedData = await this.redisAction.get(REDIS_KEYS.ANALYTICS);
        return cachedData;
      }

      const [totalUsers, subscribedUsers] = await Promise.all([
        this.userRepo.count(),
        this.userRepo
          .createQueryBuilder('user')
          .leftJoin('user.subscription', 'subscription')
          .where('subscription.subscriptionStatus = :status', { status: paymentStatus.SUCCEEDED })
          .getCount(),
      ]);

      const notSubscribedUsers = totalUsers - subscribedUsers;
      const totalSubscriptions = subscribedUsers;

      const analyticsData = {
        message: "Analytics fetched successfully",
        totalUsers,
        subscribedUsers,
        notSubscribedUsers,
        totalSubscriptions,
      };

      await this.redisAction.set(REDIS_KEYS.ANALYTICS, analyticsData, 60);

      return analyticsData;

    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  }

}
