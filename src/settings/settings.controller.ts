import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { SettingsService } from './settings.service';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { CreateSettingsDto } from "./dto/create-setting.dto";
import { RolesGuard } from "../auth/guards/role.guard";

@Controller('settings')
@UseGuards(JwtGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  create(@Body() createSettingDto: CreateSettingsDto) {
    return this.settingsService.updateSettings(createSettingDto);
  }

  @Get()
  findAll() {
    return this.settingsService.getSettings();
  }
}
