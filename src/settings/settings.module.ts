import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { MongooseModule } from "@nestjs/mongoose";
import { Settings, SettingsSchema } from "./entities/setting.entity";
@Module({
  imports:[
    MongooseModule.forFeature([{ name: Settings.name, schema: SettingsSchema }]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports:[SettingsService]
})
export class SettingsModule {}
