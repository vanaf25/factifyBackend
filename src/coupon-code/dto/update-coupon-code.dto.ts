import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponCodeDto } from './create-coupon-code.dto';

export class UpdateCouponCodeDto extends PartialType(CreateCouponCodeDto) {}
