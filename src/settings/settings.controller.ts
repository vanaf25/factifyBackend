import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { SettingsService } from './settings.service';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { CreateSettingsDto } from "./dto/create-setting.dto";

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() createSettingDto: CreateSettingsDto) {
    return this.settingsService.updateSettings(createSettingDto);
  }
  @Get()
  findAll() {
    return this.settingsService.getSettings();
  }
}
