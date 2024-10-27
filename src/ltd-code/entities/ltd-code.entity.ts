import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
export type LtdCodeDocument = LtdCode & Document;

@Schema()
export class LtdCode {
  @Prop({required:true})
  platform:string
  @Prop({required:true,default:uuidv4()})
  code:string
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user: Types.ObjectId;
  @Prop({ required: false })
  usedAt: Date;
}
export const LtdCodeSchema = SchemaFactory.createForClass(LtdCode);
