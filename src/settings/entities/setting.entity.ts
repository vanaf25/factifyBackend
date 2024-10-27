import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Settings extends Document {
  @Prop({ required: true })
  apiKey: string;

  @Prop({ required: true })
  prompt: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
