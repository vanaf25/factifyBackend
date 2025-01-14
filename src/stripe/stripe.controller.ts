import {
  Body,
  Controller,
  Post,
  UseGuards,
  Delete,
  Req,
  Res,
  HttpException,
  Headers,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetUser } from "../auth/decorators/get-user-decorator";
import Stripe from "stripe";
import { ConfigService } from "@nestjs/config";
@Controller('stripe')
export class StripeController {
  private stripe: Stripe;
  private readonly webhookSecret: string;
  constructor(
    private readonly stripeService: StripeService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-09-30.acacia',
    });
    this.webhookSecret = this.configService.get<string>('WEBHOOK_SECRET_KEY');
  }
  @UseGuards(JwtGuard) // Ensure user is authenticated
  @Post('create-subscription')
  async createSubscription(
    @GetUser() user,
    @Body() dto: {plan:string,paymentMethod:string,type:"month" | "year"},
  ) {
    return await this.stripeService.createSubscription(user.id, dto.plan,dto.type,
      dto.paymentMethod);
  }
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request, @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ): Promise<void> {
    console.log('endpoint secret: ',this.webhookSecret);
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.body, signature as string, this.webhookSecret);
    } catch (err) {
      console.log("reg:",this.webhookSecret);
      console.error(`Webhook error: ${err.message}`);
      throw new HttpException(`Webhook Error: ${err.message}`, HttpStatus.BAD_REQUEST);
    }
    await  this.stripeService.handleWebhookEvent(event, signature as string);
    res.status(200).send('Received');
  }
  @UseGuards(JwtGuard) // Ensure user is authenticated
  @Delete("")
  async deleteSubscription(@GetUser() user:any){
    return this.stripeService.cancelSubscription(user.id);
  }
}
