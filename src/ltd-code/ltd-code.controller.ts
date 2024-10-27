import { Controller, Get, Post, Body, Param, Delete, UseGuards } from "@nestjs/common";
import { LtdCodeService } from './ltd-code.service';
import { CreateLtdCodeDto } from './dto/create-ltd-code.dto';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetUser } from "../auth/decorators/get-user-decorator";
@Controller('ltdCode')
export class LtdCodeController {
  constructor(private readonly ltdCodeService: LtdCodeService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() createLtdCodeDto: CreateLtdCodeDto) {
    return this.ltdCodeService.generateCodes(createLtdCodeDto);
  }
  @Post('redeem/:codeId')
  @UseGuards(JwtGuard)
  async redeemCode(@Param('codeId') codeId: string, @GetUser() user: any) {
    return this.ltdCodeService.redeemCode(user.id, codeId);
  }
  @Get()
  findAll() {
    return this.ltdCodeService.findAll();
  }
  @Get('coupons/:id')
  findOne(@Param('id') id: string) {
    return this.ltdCodeService.getRedeemedCouponsByUserId(id);
  }
  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') codeId: string) {
    return this.ltdCodeService.removeCode(codeId);
  }
}
