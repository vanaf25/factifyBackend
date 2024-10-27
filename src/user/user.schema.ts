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
  @Prop({ required: true,default:"Starter plan" })
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
  resetTokenExpiration: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
