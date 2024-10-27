import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateLtdCodeDto } from './dto/create-ltd-code.dto';
import { UpdateLtdCodeDto } from './dto/update-ltd-code.dto';
import { InjectModel } from "@nestjs/mongoose";
import { LtdCode, LtdCodeDocument } from "./entities/ltd-code.entity";
import { Model, Types } from "mongoose";
import { UserService } from "../user/user.service";
import { Cron } from "@nestjs/schedule";
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class LtdCodeService {
  constructor(
    @InjectModel(LtdCode.name) private ltdCodeModel: Model<LtdCodeDocument>,
    private readonly userService:UserService,
  ) {
  }
  @Cron('0 0 * * *') // This will run daily at midnight
  async checkAndAddMonthlyCredits() {
    const today = new Date();

    // Find all LtdCodes where coupon was applied (usedAt exists)
    const appliedCoupons = await this.ltdCodeModel.find({ usedAt: { $exists: true } })

    for (const coupon of appliedCoupons) {
      const appliedDate = new Date(coupon.usedAt);
      if (this.isMonthlyAnniversary(appliedDate, today)) {
        // Add 50 credits to the user
        await this.userService.addCredits(coupon.user as any , 50);
        console.log(`Added 50 credits to user ${coupon.user._id} for coupon anniversary.`);
      }
    }
  }

  // Helper function to check if today is the monthly anniversary of the coupon application
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
    console.log(codeId);
    const code = await this.ltdCodeModel.findOne({ code: codeId });
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
  findAll() {
    return `This action returns all ltdCode`;
  }
  async getRedeemedCouponsByUserId(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }
    return this.ltdCodeModel.find({ user: userId, usedAt: { $exists: true } });
  }
  findOne(id: number) {
    return `This action returns a #${id} ltdCode`;
  }

  update(id: number, updateLtdCodeDto: UpdateLtdCodeDto) {
    console.log('upd:',updateLtdCodeDto);
    return `This action updates a #${id} ltdCode`;
  }

  remove(id: number) {
    return `This action removes a #${id} ltdCode`;
  }
}
