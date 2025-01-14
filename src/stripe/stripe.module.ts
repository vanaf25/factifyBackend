import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "../user/user.module";
import { MongooseModule } from "@nestjs/mongoose";
import { SubscriptionSchema } from "./entities/stripe.entity";

@Module({
  imports: [ConfigModule,UserModule,
    MongooseModule.forFeature([{
      name: 'Subscription', schema: SubscriptionSchema
    }])],
  controllers: [StripeController],
  providers: [StripeService],
  exports:[StripeService]
})
export class StripeModule {}
