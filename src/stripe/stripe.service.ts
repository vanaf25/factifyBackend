import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UserService } from "../user/user.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SubscriptionDocument } from "./entities/stripe.entity";
// Real keys
const plans = {
  pro: {
    month: "price_1QWdQNDPaR2OOfkxdzSluJdx",
    year: "price_1QTaKHDPaR2OOfkxlbgLUkNB",
  },
  business: {
    month: "price_1QWdQNDPaR2OOfkxdzSluJdx",
    year: "price_1QTaOiDPaR2OOfkxhweafam9",
  },
  starter:{
    month:"price_1QWdOFDPaR2OOfkxKZM4TIuG",
    year:"price_1QTaPYDPaR2OOfkxZIB9SOg8"
  }
};
//Tested My Data
/*
const plans = {
  pro: {
    month: "price_1QG4w0G7nspIT2aidFBG57Bh",
    year: "price_1QGm09G7nspIT2aiqMGA0n0X",
  },
  business: {
    month: "price_1QGS4zG7nspIT2aisrIpFFEA",
    year: "price_1QGlzMG7nspIT2aiNet5M2n3",
  },
  starter:{
    month:"price_1QGsPpG7nspIT2aiXhdoCh06",
    year:"price_1QGsQFG7nspIT2ain1dvLmJH"
  }
};
*/
@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly webhookSecret: string;
  constructor(
    @InjectModel('Subscription') private readonly subscriptionModel:
      Model<SubscriptionDocument>,
    private configService: ConfigService,
    private readonly userService: UserService, // Inject UserService
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-09-30.acacia',
    });
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET'); // Initialize webhookSecret
  }

  async createCustomerIfNotExists(userId: string, paymentMethod: string) {
    const user = await this.userService.findById2(userId)
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      payment_method: paymentMethod,
      invoice_settings: { default_payment_method: paymentMethod },
    });

    await this.userService.updateUser(userId, {stripeCustomerId:customer.id});
    return customer.id;
  }

  async createSubscription(
    userId: string,
    plan: string,
    type: "month" | "year",
    paymentMethod: string
  ) {
    const customerId = await this.createCustomerIfNotExists(userId, paymentMethod);
    const user = await this.userService.findById2(userId);
    if (user.subscription === plan && user.subscriptionType===type) {
      throw new BadRequestException("You have already activated this plan!");
    }
    const priceId = plans[plan][type];
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ['latest_invoice.payment_intent'],
    });
    await this.userService.changeSubscription(userId, {plan,customerId,
      type,
      subscriptionId:subscription.id});
    return subscription;
  }
  async cancelSubscription(userId:string){
    const user=await this.userService.findById2(userId);
    if(user.subscriptionId){
      await this.stripe.subscriptions.cancel(
        user.subscriptionId
      );
    await this.userService.cancelSubscription(user._id as string);
    return {message:"cancelled successfully!"}
    }
  }
  async handleWebhookEvent(event: any, signature: string) {
    console.log('signatur',signature);
    try {
      switch (event.type) {
        case "invoice.created":{
          const invoice = event.data.object;
          const customerId = invoice.customer;
          const email=invoice.customer_email;
          const priceId = invoice?.lines?.data[0]?.price?.id;
          console.log('email',email);
          console.log('priceId:',priceId);
          console.log('customer:',customerId);
          const user:any = await this.userService.findByEmail(email);
          console.log('u:',user);
          if (user) {
            let currentPlan={type:"",plan:""}
          Object.entries(plans).forEach(el=>{
              const elms=el[1];
              if(elms.month===priceId) currentPlan={type:"month",plan:el[0]}
              if(elms.year===priceId) currentPlan={type:"year",plan:el[0]}
            });
            console.log('currentPlan:',currentPlan);
            await this.userService.changeSubscription(user.id, {type:currentPlan.type,customerId,
              plan:currentPlan.plan,
              subscriptionId:invoice.subscription});
          }
          break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          const email=invoice.customer_email;
          const priceId = invoice?.lines?.data[0]?.price?.id;
          console.log('email',email);
          console.log('priceId:',priceId);
          console.log('customer:',customerId);
          const user = await this.userService.findByStripeCustomerId(customerId as string);
          const subscriptionStartDate = new Date(user.subscriptionStartDate);
          const today = new Date();

          // Приводим обе даты к полуночи, чтобы сравнивать только дату без времени
          subscriptionStartDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          if (user &&  subscriptionStartDate.getTime() !== today.getTime()) {
            const creditsToAdd = this.getCreditsForPlan(user.subscription);
            user.credits += creditsToAdd;
              await this.userService.sendSubscriptionEmail(user.email,user.name,{plan
                  :user.subscription,credits:creditsToAdd});
            await this.userService.updateUser(user._id, { credits: user.credits });
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription;
          const priceId = invoice?.lines?.data[0]?.price?.id;
          console.log('inovice:',priceId);
          console.log(`Payment failed for subscription ${subscriptionId}`);
          // Call service to update user subscription status
          break;
        }
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          if (subscription.status === 'past_due') {
            console.log(`Subscription is past due: ${subscription.id}`);
            // Update user's access as needed
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Subscription canceled: `,subscription);
          // Handle cancellation
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // Placeholder methods - integrate with your database or user service
  private async getCustomerIdForUser(userId: string): Promise<string | null> {
    console.log('u:',userId);
    return null
  }
  private getCreditsForPlan(subscription: string): number {
    switch (subscription) {
      case 'starter':
        return 10;
      case 'pro':
        return 100;
      case 'business':
        return 150;
      default:
        return 0;
    }
  }
  private async saveCustomerIdForUser(userId: string, customerId: string) {
    console.log('userId:', userId);
    console.log('customerId:', customerId);
    // Save Stripe customer ID for the user in the database
  }
}
