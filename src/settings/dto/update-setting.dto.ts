import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingsDto } from './create-setting.dto';

export class UpdateSettingDto extends PartialType(CreateSettingsDto) {}
