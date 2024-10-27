import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateLtdCodeDto {
  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsInt()
  @Min(1)
  codesAmount: number;
}