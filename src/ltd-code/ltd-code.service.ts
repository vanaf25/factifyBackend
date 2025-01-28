import { forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateLtdCodeDto } from './dto/create-ltd-code.dto';
import { InjectModel } from "@nestjs/mongoose";
import { LtdCode, LtdCodeDocument } from "./entities/ltd-code.entity";
import { Model, Types } from "mongoose";
import { UserService } from "../user/user.service";
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class LtdCodeService {
  constructor(
    @InjectModel(LtdCode.name) private ltdCodeModel: Model<LtdCodeDocument>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
  }
  async checkAndAddMonthlyCredits() {
    const today = new Date();

    const appliedCoupons = await this.ltdCodeModel.find(
      { usedAt: { $exists: true } })

    for (const coupon of appliedCoupons) {
      const appliedDate = new Date(coupon.usedAt);
      if (this.isMonthlyAnniversary(appliedDate, today)) {
        await this.userService.addCredits(coupon.user as any , 50);
        console.log(`Added 50 credits to user ${coupon.user._id} for coupon anniversary.`);
      }
    }
  }

  isMonthlyAnniversary(appliedDate: Date, today: Date): boolean {
    const isSameDay = appliedDate.getDate() === today.getDate(); // Check if the day matches
    const isNextMonth = today.getMonth() !== appliedDate.getMonth() && today.getFullYear() >= appliedDate.getFullYear();

    return isSameDay && isNextMonth;
  }
  async generateCodes(createDto: CreateLtdCodeDto) {
    const codes = [];
    for (let i = 0; i < createDto.codesAmount; i++) {
      const code =
        await this.ltdCodeModel.create({ platform: createDto.platform,code:uuidv4()});
      codes.push(code);
    }
    return codes.map(code=>code.code);
  }
  async redeemCode(userId: Types.ObjectId, codeId: string) {
    const code = await this.ltdCodeModel.findOne({ code: codeId });
    console.log('code:',code);
    if (!code || code.user) throw new NotFoundException('Code not found or already redeemed');
    await this.userService.findById(userId as any)
    await this.userService.applyCode(userId,code._id as string)
    code.user =userId;
    code.usedAt = new Date();
    await code.save();
    return {message:"Code redeemed"}
  }
  async removeCode(codeId: string) {
    const code=await this.ltdCodeModel.findById(codeId);
      if(!code) throw new NotFoundException("LTD code was not founded")
    await this.userService.removeLtdCode(code.user,codeId);
    await this.ltdCodeModel.findByIdAndDelete(codeId);
    return {success:true}
  }
  async getCode(codeId: string) {
      const code = await this.ltdCodeModel
      .findOne({code:codeId})
      .populate('user', '_id name email credits');
    console.log('code:',code);
    if (!code) {
      throw new NotFoundException('LTD code not found');
    }
    return {
      user:code.user
    }
  }
  async getRedeemedCouponsByUserId(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }
    return this.ltdCodeModel.find({ user: userId, usedAt: { $exists: true } });
  }
  async removeUserCodes(codesId: Types.ObjectId[]) {
    for (const code of codesId) {
      await this.ltdCodeModel.findByIdAndDelete(code);
    }
    return { success: true, message: `${codesId} codes have been removed.` };
  }
}
