import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from "./entities/setting.entity";
import { CreateSettingsDto } from "./dto/create-setting.dto";

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {}

  // Fetch the single settings document
  async getSettings(): Promise<Settings> {
    return await this.settingsModel.findOne();
  }

  // Update or create settings with API key and Perplexity API key
  async updateSettings(data:CreateSettingsDto): Promise<Settings> {
    const existingSettings = await this.settingsModel.findOne();
    if (existingSettings) {
      existingSettings.apiKey = data.apiKey;
      existingSettings.prompt =data.prompt ;
      return await existingSettings.save();
    } else {
      const newSettings = new this.settingsModel(data);
      return await newSettings.save();
    }
  }
}
