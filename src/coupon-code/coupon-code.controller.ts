import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { CouponCodeService } from './coupon-code.service';
import { CreateCouponCodeDto } from './dto/create-coupon-code.dto';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetUser } from "../auth/decorators/get-user-decorator";
import { RolesGuard } from "../auth/guards/role.guard";

@Controller('couponCode')
export class CouponCodeController {
  constructor(private readonly couponCodeService: CouponCodeService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  create(@Body() createCouponCodeDto: CreateCouponCodeDto) {
    return this.couponCodeService.createCoupons(createCouponCodeDto);
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  findAll() {
    return this.couponCodeService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  applyCode(@GetUser() user: any, @Param('id') id: string) {
    return this.couponCodeService.findOne(id, user.id);
  }
}
