import { forwardRef, Module } from "@nestjs/common";
import { CouponCodeService } from './coupon-code.service';
import { CouponCodeController } from './coupon-code.controller';
import { MongooseModule } from "@nestjs/mongoose";
import {CouponCodeSchema } from "./entities/coupon-code.entity";
import { UserModule } from "../user/user.module";
@Module({
  imports:[
    UserModule,
    MongooseModule.forFeature([{ name:"CouponCode", schema: CouponCodeSchema }])
  ],
  controllers: [CouponCodeController],
  providers: [CouponCodeService],
  exports:[CouponCodeService]
})
export class CouponCodeModule {}
