import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { CouponCodeService } from './coupon-code.service';
import { CreateCouponCodeDto } from './dto/create-coupon-code.dto';
import { UpdateCouponCodeDto } from './dto/update-coupon-code.dto';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetUser } from "../auth/decorators/get-user-decorator";

@Controller('couponCode')
export class CouponCodeController {
  constructor(private readonly couponCodeService: CouponCodeService) {}
  @Post()
  @UseGuards(JwtGuard)
  create(@Body() createCouponCodeDto: CreateCouponCodeDto) {
    return this.couponCodeService.createCoupons(createCouponCodeDto);
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll() {
    return this.couponCodeService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@GetUser() user:any, @Param('id') id: string) {
    return this.couponCodeService.findOne(id,user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCouponCodeDto: UpdateCouponCodeDto) {
    return this.couponCodeService.update(+id, updateCouponCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponCodeService.remove(+id);
  }
}
