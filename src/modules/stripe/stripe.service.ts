import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { subscriptionEnum, paymentStatus } from 'src/types/enums/subscription';
import { userEntity } from '../user/entity/user.entity';
import { discountConfigEntity, userPlanEntity } from '../user/entity/userPlan.entity';
import { SubscribeDto, AttachPaymentMethodDto } from './dto/stripe.dto';
import { Request } from 'express';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(userEntity)
    private userRepo: Repository<userEntity>,

    @InjectRepository(userPlanEntity)
    private planRepo: Repository<userPlanEntity>,

    @InjectRepository(discountConfigEntity)
    private discountConfigRepo: Repository<discountConfigEntity>,

    private readonly configService: ConfigService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SIGN') || '';
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
  }

  // -------------------- Retrieve Stripe Customer --------------------
  async getStripeCustomer(userId: number): Promise<{ user: any; customer: any; message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.stripeCustomerId) throw new BadRequestException('User does not have a Stripe customer ID');

    try {
      let customer = (await this.stripe.customers.retrieve(user.stripeCustomerId, {
        expand: ['invoice_settings.default_payment_method'],
      })) as Stripe.Customer;

      return {
        message: 'Customer retrieved successfully',
        user: {
          id: user.id,
          email: user.email,
          stripeCustomerId: user.stripeCustomerId,
          paymentMethodId: user.paymentMethodId,
        },
        customer: {
          id: customer.id,
          email: customer.email,
          invoiceSettings: customer.invoice_settings,
          defaultPaymentMethod: customer.invoice_settings?.default_payment_method,
          metadata: customer.metadata,
        },
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to retrieve Stripe customer: ' + error.message);
    }
  }

  // -------------------- Attach Payment Method --------------------
  async attachPaymentMethod(userId: number, attachDto: AttachPaymentMethodDto): Promise<{ message: string; paymentMethodId: string }> {
    const { paymentMethodId } = attachDto;
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');
    if (!user.stripeCustomerId) throw new BadRequestException('User does not have a Stripe customer ID');

    try {
      // Attach the payment method to the Stripe customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      user.paymentMethodId = paymentMethodId;
      await this.userRepo.save(user);

      return { message: 'Payment method attached successfully', paymentMethodId };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to attach payment method: ' + error.message);
    }
  }

  // -------------------- Get Active Discount --------------------
  private async getActiveDiscount(): Promise<discountConfigEntity | null> {
    // Get the active discount configuration
    return await this.discountConfigRepo.findOne({
      where: { isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  // -------------------- Create Subscription (With Discount Support) --------------------
  async createSubscription(userId: number, subscribeDto: SubscribeDto): Promise<{
    message: string;
    subscriptionId: string;
    status: string;
    discount?: {
      applied: boolean;
      percentage?: number;
      name?: string;
    };
  }> {
    const { name, phoneNumber } = subscribeDto;
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['subscription'] });
    if (!user) throw new NotFoundException('User not found');

    if (user.subscription && (user.subscription.subscriptionStatus === paymentStatus.SUCCEEDED || user.subscription.subscriptionStatus === paymentStatus.PENDING)) {
      throw new ConflictException('User already has an active subscription');
    }

    if (!user.paymentMethodId) {
      throw new BadRequestException('No payment method attached. Please attach a valid payment method before subscribing.');
    }

    const priceId = this.configService.get<string>('STRIPE_REGULAR_PRICE_ID');

    try {
      // Check for active discount
      const activeDiscount = await this.getActiveDiscount();
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: user.stripeCustomerId,
        items: [{ price: priceId }],
        default_payment_method: user.paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
      };

      // If there's an active discount, apply it to the subscription
      if (activeDiscount && activeDiscount.percentage > 0) {
        // Create a coupon with the current discount percentage
        const coupon = await this.stripe.coupons.create({
          percent_off: activeDiscount.percentage,
          duration: 'once',
          name: activeDiscount.name || `Discount ${activeDiscount.percentage}%`,
        });

        // Apply the coupon to the subscription
        subscriptionParams.coupon = coupon.id;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      const newPlan = this.planRepo.create({
        stripeSubscriptionId: subscription.id,
        planType: subscriptionEnum.REGULAR,
        subscriptionStatus: subscription.status === 'active' ? paymentStatus.SUCCEEDED : paymentStatus.PENDING,
        user: user,
        name,
        phoneNumber,
        appliedDiscountId: activeDiscount?.id,
        appliedDiscountPercentage: activeDiscount?.percentage,
      });

      await this.planRepo.save(newPlan);

      return {
        message: 'Subscribed to Regular Plan successfully',
        subscriptionId: subscription.id,
        status: subscription.status,
        ...(activeDiscount && {
          discount: {
            applied: true,
            percentage: activeDiscount.percentage,
            name: activeDiscount.name
          }
        })
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create subscription: ' + error.message);
    }
  }

  // -------------------- Get Subscription Status --------------------
  async getSubscriptionStatus(userId: number): Promise<{
    isSubscribed: boolean;
    status?: string;
    planType?: string;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
    appliedDiscount?: {
      percentage: number;
      name: string;
    }
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['subscription'] });
    if (!user) throw new NotFoundException('User not found');

    if (!user.subscription || user.subscription.subscriptionStatus !== paymentStatus.SUCCEEDED) {
      return { isSubscribed: false };
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(user.subscription.stripeSubscriptionId);

      const response = {
        isSubscribed: subscription.status === 'active',
        status: subscription.status,
        planType: user.subscription.planType,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };

      // Add discount information if available
      if (user.subscription.appliedDiscountPercentage) {
        return {
          ...response,
          appliedDiscount: {
            percentage: user.subscription.appliedDiscountPercentage,
            name: user.subscription.appliedDiscountName || 'Custom Discount'
          }
        };
      }

      return response;
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        user.subscription.subscriptionStatus = paymentStatus.CANCELED;
        await this.planRepo.save(user.subscription);
        return { isSubscribed: false };
      }
      throw new InternalServerErrorException(`Failed to get subscription status: ${error.message}`);
    }
  }

  // -------------------- Cancel Subscription --------------------
  async cancelSubscription(userId: number): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['subscription'] });
    if (!user || !user.subscription) throw new NotFoundException('No active subscription found');

    try {
      await this.stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return { message: 'Subscription will be canceled at the end of the billing period' };
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        user.subscription.subscriptionStatus = paymentStatus.CANCELED;
        await this.planRepo.save(user.subscription);
        return { message: 'Subscription not found in Stripe, marked as canceled in database' };
      }
      throw new InternalServerErrorException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  // -------------------- Admin: Set Discount Configuration --------------------
  async setDiscountConfiguration(adminId: number, data: { percentage: number; name?: string; isActive: boolean }): Promise<discountConfigEntity> {
    const admin = await this.userRepo.findOne({ where: { id: adminId } });
    if (!admin || admin.role !== 'ADMIN') {
      throw new BadRequestException('Unauthorized: Only admins can configure discounts');
    }

    const { percentage, name, isActive } = data;

    // Validate discount percentage
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Discount percentage must be between 0 and 100');
    }

    try {
      // If setting a new active discount, deactivate all other discounts
      if (isActive) {
        await this.discountConfigRepo.update({}, { isActive: false });
      }

      // Create new discount configuration
      const discountConfig = this.discountConfigRepo.create({
        percentage,
        name: name || `Discount ${percentage}%`,
        isActive,
        createdBy: adminId
      });

      await this.discountConfigRepo.save(discountConfig);
      return discountConfig;
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to set discount configuration: ${error.message}`);
    }
  }

  // -------------------- Admin: Get Current Discount Configuration --------------------
  async getCurrentDiscountConfiguration(): Promise<discountConfigEntity | null> {
    try {
      return await this.getActiveDiscount();
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to get discount configuration: ${error.message}`);
    }
  }

  // -------------------- Admin: Get All Discount Configurations --------------------
  async getAllDiscountConfigurations(): Promise<discountConfigEntity[]> {
    try {
      return await this.discountConfigRepo.find({
        order: { updatedAt: 'DESC' }
      });
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to get all discount configurations: ${error.message}`);
    }
  }

  // -------------------- Handle Stripe Webhook --------------------
  async handleStripeWebhook(req: Request): Promise<{ message: string }> {
    const sig = req.headers['stripe-signature'];
    if (!sig || !this.webhookSecret) {
      throw new BadRequestException('Webhook secret or signature missing');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.body, sig, this.webhookSecret);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed.', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    return { message: 'Webhook received' };
  }

  // -------------------- Handle Payment Succeeded --------------------
  private async handlePaymentSucceeded(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;
    const subscription = await this.planRepo.findOne({
      where: { stripeSubscriptionId: subscriptionId },
      relations: ['user'],
    });

    if (!subscription) {
      console.warn(`Subscription ${subscriptionId} not found in database.`);
      return;
    }

    subscription.subscriptionStatus = paymentStatus.SUCCEEDED;
    await this.planRepo.save(subscription);
    console.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
  }

  // -------------------- Handle Subscription Updated --------------------
  private async handleSubscriptionUpdated(event: Stripe.Event) {
    const subscriptionData = event.data.object as Stripe.Subscription;
    const subscriptionId = subscriptionData.id;
    const subscription = await this.planRepo.findOne({
      where: { stripeSubscriptionId: subscriptionId },
      relations: ['user'],
    });

    if (!subscription) {
      console.warn(`Subscription ${subscriptionId} not found in database.`);
      return;
    }

    subscription.subscriptionStatus =
      subscriptionData.status === 'active'
        ? paymentStatus.SUCCEEDED
        : paymentStatus.PENDING;

    await this.planRepo.save(subscription);
    console.log(`🔄 Subscription ${subscriptionId} updated: ${subscriptionData.status}`);
  }

  // -------------------- Handle Subscription Canceled --------------------
  private async handleSubscriptionCanceled(event: Stripe.Event) {
    const subscriptionData = event.data.object as Stripe.Subscription;
    const subscriptionId = subscriptionData.id;
    const subscription = await this.planRepo.findOne({
      where: { stripeSubscriptionId: subscriptionId },
      relations: ['user'],
    });

    if (!subscription) {
      console.warn(`Subscription ${subscriptionId} not found in database.`);
      return;
    }

    subscription.subscriptionStatus = paymentStatus.CANCELED;
    await this.planRepo.save(subscription);
    console.log(`❌ Subscription ${subscriptionId} canceled.`);
  }
}