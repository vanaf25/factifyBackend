import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document,Types } from "mongoose";
import { User } from "../user/user.schema";

export type FactDocument = Fact & Document;

@Schema()
export class Fact {
  @Prop({ required: true })
  title: string;
  @Prop({ })
  severity: string;
  @Prop({  })
  truthStatus: string;
  @Prop({
    type: [String],
  })
  keyFacts: string[];
  @Prop({
    type: String,
  })
  explanation: string;
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: Types.ObjectId;
  @Prop({
    type: Date,
    default: Date.now,
    immutable: true, // Prevents changes after creation
  })
  createdAt: Date;
  @Prop()
  content: string;
  @Prop({
    type: [new mongoose.Schema({
      title: String,
      url: String,
    })],
  })
  references: { title: string; url: string }[];
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
  })
  favoriteUsers: Types.ObjectId[];

}

export const FactSchema = SchemaFactory.createForClass(Fact);
