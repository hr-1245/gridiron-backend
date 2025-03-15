import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { userEntity } from '../user/entity/user.entity';
import { userPlanEntity } from 'src/entities/userPlan.entity';
import { ConfigService } from '@nestjs/config';
import { subscriptionEnum, paymentStatus } from 'src/types/enums/subscription';
import { SubscriptionResponseDto } from './dto/stripe.dto';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(userEntity)
    private userRepo: Repository<userEntity>,

    @InjectRepository(userPlanEntity)
    private planRepo: Repository<userPlanEntity>,

    private readonly configService: ConfigService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    // Use a valid API version
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
  }

  // -------------------- Helper to handle payment status errors --------------------
  private handlePaymentStatus(status: string): never {
    switch (status) {
      case "requires_payment_method":
        throw new BadRequestException("Payment failed. Please provide a valid payment method.");
      case "canceled":
        throw new BadRequestException("Payment was canceled.");
      case "processing":
        throw new BadRequestException("Payment is still being processed.");
      case "requires_action":
        throw new BadRequestException("Payment requires additional action.");
      case "requires_capture":
        throw new BadRequestException("Payment requires capture.");
      case "requires_confirmation":
        throw new BadRequestException("Payment requires confirmation.");
      default:
        throw new BadRequestException("Unknown payment status.");
    }
  }

  // -------------------- Retrieve Stripe Customer & Link Payment Method --------------------
  async getStripeCustomer(userId: number): Promise<{ user: any; customer: any; message: string }> {

    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    if (!user.stripeCustomerId) throw new NotFoundException('User does not have a Stripe customer ID');

    let customer: Stripe.Customer;

    try {
      // Expand default_payment_method so we can inspect it
      customer = (await this.stripe.customers.retrieve(user.stripeCustomerId, {

        expand: ['invoice_settings.default_payment_method'],

      })) as Stripe.Customer;

    } catch (error: any) {

      if (error?.code === 'resource_missing') {

        throw new NotFoundException('Stripe customer not found. It may have been deleted.');

      }

      throw new InternalServerErrorException('Failed to retrieve Stripe customer: ' + error.message);
    }

    // If a payment method is stored in the DB and it's not set as the default on Stripe, update it.
    if (user.paymentMethodId && customer.invoice_settings.default_payment_method !== user.paymentMethodId) {

      try {
        await this.stripe.customers.update(user.stripeCustomerId, {

          invoice_settings: { default_payment_method: user.paymentMethodId },

        });

        // Re-fetch updated customer data
        customer = (await this.stripe.customers.retrieve(user.stripeCustomerId, {

          expand: ['invoice_settings.default_payment_method'],

        })) as Stripe.Customer;

      } catch (error: any) {

        throw new InternalServerErrorException('Failed to update default payment method: ' + error.message);
      }
    }

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
  }

  // -------------------- Create Stripe Checkout Session for Subscription --------------------
  async createCheckoutSession(userId: number): Promise<{ sessionId: string }> {

    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user || !user.stripeCustomerId) {

      throw new NotFoundException('User not found or missing Stripe customer ID');
    }

    const priceId = this.configService.get<string>('STRIPE_REGULAR_PRICE_ID');

    if (!priceId) throw new InternalServerErrorException('Stripe price ID not configured');

    try {

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],

        customer: user.stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],

        mode: 'subscription',
        success_url: this.configService.get('STRIPE_SUCCESS_URL'),

        cancel_url: this.configService.get('STRIPE_CANCEL_URL')
      });
      return { sessionId: session.id };

    } catch (error: any) {
      if (error?.payment_intent?.status) {

        this.handlePaymentStatus(error.payment_intent.status);
      }

      throw new InternalServerErrorException('Failed to create checkout session: ' + error.message);
    }
  }


  // -------------------- Attach Payment Method --------------------
  async attachPaymentMethod(userId: number, paymentMethodId: string): Promise<{ message: string }> {

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {

      throw new NotFoundException('User not found or missing Stripe customer ID');
    }

    try {
      // Attach the payment method to the customer

      await this.stripe.paymentMethods.attach(paymentMethodId, { customer: user.stripeCustomerId });
      // Set the payment method as the default for invoice payments
      await this.stripe.customers.update(user.stripeCustomerId, {

        invoice_settings: { default_payment_method: paymentMethodId },
      });
      // Save the payment method ID in the user record
      user.paymentMethodId = paymentMethodId;

      await this.userRepo.save(user);
      return { message: 'Payment method attached successfully' };

    } catch (error: any) {
      if (error?.payment_intent?.status) {
        this.handlePaymentStatus(error.payment_intent.status);

      }
      throw new InternalServerErrorException('Failed to attach payment method: ' + error.message);
    }
  }

  async createSubscription(userId: number): Promise<SubscriptionResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user || !user.stripeCustomerId) {
      throw new NotFoundException('User not found or missing Stripe customer ID');
    }


    // Make sure the customer already has a valid payment method attached

    if (!user.paymentMethodId) {
      throw new BadRequestException('No payment method attached. Please attach a valid payment method before subscribing.');
    }

    const priceId = this.configService.get<string>('STRIPE_REGULAR_PRICE_ID');

    if (!priceId) throw new InternalServerErrorException('Stripe price ID not configured');

    try {
      const subscription = await this.stripe.subscriptions.create({

        customer: user.stripeCustomerId,

        items: [{ price: priceId }],

        expand: ['latest_invoice.payment_intent'],
      });

      // Optionally, store/update the subscription details in your database
      const newPlan = this.planRepo.create({

        stripeSubscriptionId: subscription.id,
        planType: subscriptionEnum.REGULAR,

        subscriptionStatus: subscription.status === 'active' ? paymentStatus.SUCCEEDED : paymentStatus.PENDING,
        user: user,

      });
      await this.planRepo.save(newPlan);

      return {

        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (error: any) {
      if (error?.payment_intent?.status) {
        this.handlePaymentStatus(error.payment_intent.status);
      }
      throw new InternalServerErrorException('Failed to create subscription: ' + error.message);
    }
  }


  // -------------------- Cancel Subscription --------------------
  async cancelSubscription(userId: number): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['subscription'] });
    if (!user || !user.subscription) {
      throw new NotFoundException('No active subscription found');
    }
    try {
      await this.stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
      user.subscription.subscriptionStatus = paymentStatus.CANCELED;
      await this.planRepo.save(user.subscription);
      return { message: 'Subscription canceled successfully' };
    } catch (error: any) {
      if (error?.payment_intent?.status) {
        this.handlePaymentStatus(error.payment_intent.status);
      }
      throw new InternalServerErrorException('Failed to cancel subscription: ' + error.message);
    }
  }
}
