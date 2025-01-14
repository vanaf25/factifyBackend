import { Controller, Get, Post, Body, Param, Delete, UseGuards } from "@nestjs/common";
import { LtdCodeService } from './ltd-code.service';
import { CreateLtdCodeDto } from './dto/create-ltd-code.dto';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetUser } from "../auth/decorators/get-user-decorator";
import { RolesGuard } from "../auth/guards/role.guard";
import { Cron } from "@nestjs/schedule";

@Controller('ltdCode')
export class LtdCodeController {
  constructor(private readonly ltdCodeService: LtdCodeService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  create(@Body() createLtdCodeDto: CreateLtdCodeDto) {
    return this.ltdCodeService.generateCodes(createLtdCodeDto);
  }

  @Post('redeem/:codeId')
  @UseGuards(JwtGuard)
  async redeemCode(@Param('codeId') codeId: string, @GetUser() user: any) {
    return this.ltdCodeService.redeemCode(user.id, codeId);
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  findAll() {
    return this.ltdCodeService.findAll();
  }

  @Get('coupons/:id')
  @UseGuards(JwtGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.ltdCodeService.getRedeemedCouponsByUserId(id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  remove(@Param('id') codeId: string) {
    return this.ltdCodeService.removeCode(codeId);
  }
  @Cron('0 0 * * *')
  receiveCredits(){
    return this.ltdCodeService.checkAndAddMonthlyCredits()
  }
}
