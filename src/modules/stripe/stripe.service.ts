import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
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
import { mailService } from '../mail/mail.service';
import subscriptionTemplate from '../mail/template/subscription-template';
import { adminauthEntity } from '../admin/entity/admin.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @InjectRepository(userEntity)
    private userRepo: Repository<userEntity>,

    @InjectRepository(adminauthEntity)
    private adminRepo: Repository<adminauthEntity>,

    @InjectRepository(userPlanEntity)
    private planRepo: Repository<userPlanEntity>,

    @InjectRepository(discountConfigEntity)
    private discountConfigRepo: Repository<discountConfigEntity>,

    private readonly configService: ConfigService,
    private readonly MailService: mailService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SIGN') || '';
    // Using latest stable API version
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
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to retrieve Stripe customer: ${error.message}`, error.stack);
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
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
      });

      await this.stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      user.paymentMethodId = paymentMethodId;
      await this.userRepo.save(user);

      return { message: 'Payment method attached successfully', paymentMethodId };
    } catch (error: any) {
      throw new NotFoundException('Failed to attach payment method: ' + error.message);
    }
  }

  // -------------------- Get Active Discount --------------------
  private async getActiveDiscount(): Promise<discountConfigEntity | null> {
    return await this.discountConfigRepo.findOne({
      where: { isActive: true },
      order: { updatedAt: 'asc' },
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
    if (!priceId) {
      throw new InternalServerErrorException('Stripe price ID not configured');
    }

    try {
      const activeDiscount = await this.getActiveDiscount();
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: user.stripeCustomerId,
        items: [{ price: priceId }],
        default_payment_method: user.paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
      };

      let discountInfo: { percentage: number; name: string } | null = null;
      if (activeDiscount && activeDiscount.percentage > 0) {
        const coupon = await this.stripe.coupons.create({
          percent_off: activeDiscount.percentage,
          duration: 'once',
          name: activeDiscount.name || `Discount ${activeDiscount.percentage}%`,
        });

        subscriptionParams.coupon = coupon.id;
        discountInfo = {
          percentage: activeDiscount.percentage,
          name: activeDiscount.name || `Discount ${activeDiscount.percentage}%`
        };
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      const validUntil = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;

      const newPlan = this.planRepo.create({
        stripeSubscriptionId: subscription.id,
        planType: subscriptionEnum.REGULAR,
        subscriptionStatus: subscription.status === 'active' ? paymentStatus.SUCCEEDED : paymentStatus.PENDING,
        validUntil: validUntil as any,
        user: user,
        name,
        phoneNumber,
        appliedDiscountId: activeDiscount?.id,
        appliedDiscountPercentage: activeDiscount?.percentage,
        appliedDiscountName: activeDiscount?.name,
      });

      await this.planRepo.save(newPlan);

      if (validUntil) {
        const discountApplied = activeDiscount ? {
          percentage: activeDiscount.percentage,
          name: activeDiscount.name || `${activeDiscount.percentage}% Discount`
        } : undefined;

        await this.sendAIConversionCongratulationEmail(
          user.email,
          subscriptionEnum.REGULAR,
          validUntil,
          discountApplied
        );
      }
      const successMessage = activeDiscount
        ? `Subscribed to Regular Plan successfully with ${activeDiscount.percentage}% discount`
        : 'Subscribed to Regular Plan successfully';

      return {
        message: successMessage,
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
      this.logger.error(`Failed to create subscription: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create subscription: ' + error.message);
    }
  }
  private async sendAIConversionCongratulationEmail(
    email: string,
    planType: string,
    endDate: Date,
    discountApplied?: { percentage: number, name: string }
  ): Promise<void> {
    try {
      await this.MailService.sendMail({
        mailOptions: {
          to: email,
          subject: 'Your AI Player Conversion Tools Are Ready! 🏈',
          html: subscriptionTemplate(email, planType, endDate, discountApplied)
        }
      });
    } catch (error) {
    }
  }

  // -------------------- Admin: Remove Active Discount --------------------
  async removeActiveDiscountConfiguration(adminId: number): Promise<{ message: string }> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const activeDiscount = await this.discountConfigRepo.findOne({
      where: { isActive: true },
    });

    if (!activeDiscount) {
      return { message: 'No active discount to remove' };
    }

    activeDiscount.isActive = false;
    await this.discountConfigRepo.save(activeDiscount);

    return { message: 'Active discount configuration removed successfully' };
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
      this.logger.error(`Failed to get subscription status: ${error.message}`, error.stack);
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

        return {
          message: 'Subscription not found in Stripe, marked as canceled in database'
        };
      }
      throw new InternalServerErrorException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  // -------------------- Admin: Set Discount Configuration --------------------
  async setDiscountConfiguration(adminId: number, data: { percentage: number; name?: string; isActive: boolean }): Promise<discountConfigEntity> {

    const admin = this.adminRepo.findOne({
      where: { id: adminId }
    })

    if (!admin) {
      throw new NotFoundException('Admin Not Found')
    }

    const { percentage, name, isActive } = data;

    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Discount percentage must be between 0 and 100');
    }

    try {
      if (isActive) {
        await this.discountConfigRepo.update({}, { isActive: false });
      }

      const discountConfig = this.discountConfigRepo.create({
        percentage,
        name: name,
        isActive,
      });

      await this.discountConfigRepo.save(discountConfig);
      return discountConfig;
    } catch (error: any) {
      this.logger.error(`Failed to set discount configuration: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to set discount configuration: ${error.message}`);
    }
  }

  // -------------------- Admin: Get Current Discount Configuration --------------------
  async getCurrentDiscountConfiguration(adminId: number): Promise<{
    message: string;
    discount?: discountConfigEntity;
  }> {
    try {
      const activeDiscount = await this.getActiveDiscount();

      if (!activeDiscount) {
        return {
          message: 'No active discount available',
        };
      }

      return {
        message: 'Active discount retrieved successfully',
        discount: activeDiscount,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get discount configuration: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to get discount configuration: ${error.message}`
      );
    }
  }


  // -------------------- Admin: Get All Discount Configurations --------------------
  async getAllDiscountConfigurations(adminId: number): Promise<discountConfigEntity[]> {
    try {
      return await this.discountConfigRepo.find({
        order: { updatedAt: 'ASC' }
      });
    } catch (error: any) {
      this.logger.error(`Failed to get all discount configurations: ${error.message}`, error.stack);
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
      this.logger.error('⚠️ Webhook signature verification failed.', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    try {
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
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
      return { message: 'Webhook processed successfully' };
    } catch (error: any) {
      this.logger.error(`Error processing webhook ${event.type}: ${error.message}`, error.stack);
      return { message: `Webhook received but processing error occurred: ${error.message}` };
    }
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
      this.logger.warn(`Subscription ${subscriptionId} not found in database.`);
      return;
    }

    subscription.subscriptionStatus = paymentStatus.SUCCEEDED;

    const periodEnd = invoice.lines?.data?.[0]?.period?.end;
    if (periodEnd) {
      subscription.validUntil = new Date(periodEnd * 1000);
    }

    await this.planRepo.save(subscription);
    this.logger.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
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
      this.logger.warn(`Subscription ${subscriptionId} not found in database.`);
      return;
    }

    subscription.subscriptionStatus =
      subscriptionData.status === 'active'
        ? paymentStatus.SUCCEEDED
        : paymentStatus.PENDING;

    if (subscriptionData.current_period_end) {
      subscription.validUntil = new Date(subscriptionData.current_period_end * 1000);
    }

    await this.planRepo.save(subscription);
    this.logger.log(`🔄 Subscription ${subscriptionId} updated: ${subscriptionData.status}`);
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
      this.logger.warn(`Subscription ${subscriptionId} not found in database.`);
      return;
    }

    subscription.subscriptionStatus = paymentStatus.CANCELED;

    subscription.validUntil = null as any;

    await this.planRepo.save(subscription);
    this.logger.log(`❌ Subscription ${subscriptionId} canceled.`);
  }
}