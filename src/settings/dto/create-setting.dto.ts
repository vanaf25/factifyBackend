import { IsNotEmpty } from 'class-validator';

export class CreateSettingsDto {
  @IsNotEmpty()
  apiKey: string;

  @IsNotEmpty()
  prompt: string;
}