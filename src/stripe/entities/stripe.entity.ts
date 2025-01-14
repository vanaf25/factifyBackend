import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from "mongoose";
import { User } from "../../user/user.schema";

export type SubscriptionDocument = Subscription & Document;

@Schema()
export class Subscription {
  @Prop({ required: true,default:"Starter plan" })
  plan: string;
  @Prop()
  type: string;
  @Prop()
  subscriptionId: string;
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: Types.ObjectId;
  @Prop({default:""})
  stripeCustomerId:string
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
