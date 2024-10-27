import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateCouponCodeDto } from './dto/create-coupon-code.dto';
import { UpdateCouponCodeDto } from './dto/update-coupon-code.dto';
import { InjectModel } from "@nestjs/mongoose";
import { CouponCode, CouponCodeDocument } from "./entities/coupon-code.entity";
import { Model } from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { UserService } from "../user/user.service"; // Import uuid

@Injectable()
export class CouponCodeService {
  constructor(
    @InjectModel(CouponCode.name) private couponModel: Model<CouponCodeDocument>,
    private readonly userService: UserService
  ) {}
  async createCoupons(createCouponCodeDto: CreateCouponCodeDto): Promise<CouponCode[]> {
    const { creditValue, couponAmount } = createCouponCodeDto;
    const coupons: CouponCode[] = [];

    for (let i = 0; i < couponAmount; i++) {
      const coupon = new this.couponModel({
        code: uuidv4(), // Generate unique code with uuid
        creditValue,
        isActive: true,
      });
      coupons.push(coupon);
    }

    // Save all coupons to the database at once
    return this.couponModel.insertMany(coupons);
  }
  findAll() {
    return this.couponModel.find();
  }

 async findOne(code: string,userId:string) {
    const coupon = await this.couponModel.findOne({ code }).exec();
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is no longer active');
    }
    await this.userService.addCredits(userId, coupon.creditValue);
    coupon.isActive = false;
    await coupon.save();
    return {creditsAdded:coupon.creditValue};
  }

  update(id: number, updateCouponCodeDto: UpdateCouponCodeDto) {
    console.log(updateCouponCodeDto);
    return `This action updates a #${id} couponCode`;
  }

  remove(id: number) {
    return `This action removes a #${id} couponCode`;
  }
}
