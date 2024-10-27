import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponCodeDocument = CouponCode & Document;

@Schema()
export class CouponCode {
  @Prop({ required: true, unique: true })
  code: string; // The unique code for the coupon
  @Prop({ required: true })
  creditValue: number; // The value of credits associated with the coupon
  @Prop({ default: true })
  isActive: boolean; // Indicates if the coupon is active
}

export const CouponCodeSchema = SchemaFactory.createForClass(CouponCode);
