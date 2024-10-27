import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class CreateCouponCodeDto {

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  creditValue: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  couponAmount: number;
}
