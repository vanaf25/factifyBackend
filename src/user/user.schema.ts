import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;
  @Prop({ required: true, unique: true })
  email: string;
  @Prop({ required: true })
  password: string;
  @Prop({ required: true,default:50 })
  credits: number;
  @Prop({ default:"" })
  subscription: string;
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Fact' }],
    default: [],
  })
  facts: Types.ObjectId[];
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Fact' }],
    default: [],
  })
  favoriteFacts: Types.ObjectId[];
  @Prop({ type: [{ type: Types.ObjectId, ref: 'LtdCode' }], default: [], maxlength: 5 })
  ltdCodes: Types.ObjectId[];
  @Prop({default:""})
  resetToken: string;
  @Prop({default:""})
  subscriptionType: string;
  @Prop({ default: false })
  subscriptionIsActive: boolean; // Indicates if the user has an active subscription
  @Prop({ type: Date })
  subscriptionEndDate: Date; // Date when the subscription ends
  @Prop({ type: Date })
  lastCreditUpdate: Date;
  @Prop({default:""})
  resetTokenExpiration: Date;
  @Prop({ type: Date })
  subscriptionStartDate: Date;
  @Prop({default:""})
  stripeCustomerId:string
  @Prop({default:""})
  subscriptionId:string
  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role: 'user' | 'admin';
}

export const UserSchema = SchemaFactory.createForClass(User);
