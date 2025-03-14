import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Stripe from "stripe";
import { ConfigService } from "@nestjs/config";
import { userEntity } from "src/modules/user/entity/user.entity";
import { userPlanEntity } from "src/entities/userPlan.entity";
import { subscriptionEnum, subscriptionStatus } from "src/types/enums/subscription";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>,

    @InjectRepository(userPlanEntity)
    private readonly userPlanRepo: Repository<userPlanEntity>,

    private readonly configService: ConfigService
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2025-02-24.acacia' }
    );
  }

  /**  
   * ✅ 1️⃣ Create a Trial Plan ($0.99 for 1 Month, One-Time Payment)  
   */
  async createTrialPlan(userId: number): Promise<any> {
    try {
      // ✅ Fetch User & Check Stripe Customer ID
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        throw new InternalServerErrorException('User does not have a Stripe customer ID');
      }

      // ✅ Get Trial Price ID from Config
      const trialPriceId = this.configService.get<string>('STRIPE_TRIAL_PRICE_ID');
      if (!trialPriceId) throw new InternalServerErrorException('Trial price ID missing');

      // ✅ Create a One-Time Payment for Trial ($0.99 for 1 month)
      const paymentIntent = await this.stripe.paymentIntents.create({
        customer: stripeCustomerId,
        amount: 99, // $0.99 in cents
        currency: "usd",
        payment_method_types: ["card"],
        confirm: true,
      });

      // ✅ Save Trial Subscription in DB
      let userPlan = new userPlanEntity();
      userPlan.user = user;
      userPlan.stripeSubscriptionId = paymentIntent.id; // One-time payment ID
      userPlan.planType = subscriptionEnum.TRIAL;
      userPlan.subscriptionStatus = subscriptionStatus.ACTIVE;
      await this.userPlanRepo.save(userPlan);

      return {
        message: 'Trial plan activated successfully',
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };
    } catch (error) {
      console.error('Trial Subscription Error:', error);
      throw new InternalServerErrorException(error.message || 'Trial subscription creation failed');
    }
  }

  /**  
   * ✅ 2️⃣ Create a Regular Subscription ($19.99 Recurring Monthly)  
   */
  async createSubscription(userId: number, dto: CreateSubscriptionDto): Promise<any> {
    try {
      // ✅ Fetch User & Check Stripe Customer ID
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        throw new InternalServerErrorException('User does not have a Stripe customer ID');
      }

      // ✅ Attach Payment Method (If Not Attached)
      try {
        await this.stripe.paymentMethods.attach(dto.paymentMethodId, { customer: stripeCustomerId });
      } catch (err) {
        if (err.code !== 'resource_already_attached') {
          throw new InternalServerErrorException(`Failed to attach payment method: ${err.message}`);
        }
      }

      // ✅ Set Default Payment Method
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: dto.paymentMethodId },
      });

      // ✅ Get Regular Price ID from Config
      const regularPriceId = this.configService.get<string>('STRIPE_REGULAR_PRICE_ID');
      if (!regularPriceId) throw new InternalServerErrorException('Recurring price ID missing');

      // ✅ Create a Stripe Subscription ($19.99 Recurring Monthly)
      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: regularPriceId }],
        metadata: dto.metadata ? JSON.parse(dto.metadata) : undefined,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // ✅ Save Subscription in DB
      let userPlan = new userPlanEntity();
      userPlan.user = user;
      userPlan.stripeSubscriptionId = subscription.id;
      userPlan.planType = subscriptionEnum.REGULAR;
      userPlan.subscriptionStatus = subscriptionStatus.ACTIVE;
      await this.userPlanRepo.save(userPlan);

      return {
        message: 'Subscription created successfully',
        subscriptionId: subscription.id,
        status: subscription.status,
        nextBillingDate: subscription.current_period_end,
      };
    } catch (error) {
      console.error('Subscription error:', error);
      throw new InternalServerErrorException(error.message || 'Subscription creation failed');
    }
  }

  /**  
   * ✅ 3️⃣ Get Subscription Status  
   */
  async subscriptionStatus(userId: number): Promise<any> {
    try {
      // ✅ Fetch User
      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (!user) throw new NotFoundException('User not found');

      const userPlan = await this.userPlanRepo.findOne({ where: { user: { id: userId } } });

      if (!userPlan) throw new NotFoundException('No active subscription found');

      const subscription = await this.stripe.subscriptions.retrieve(userPlan.stripeSubscriptionId);

      return {
        message: 'Subscription retrieved successfully',
        subscriptionId: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
      };
    } catch (error) {
      console.error('Subscription Status Error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to retrieve subscription status');
    }
  }
}
