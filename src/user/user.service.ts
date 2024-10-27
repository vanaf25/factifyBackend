import {
  BadRequestException, ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import mongoose, { Model, Types } from "mongoose";
import { UserDetails } from './user-details.interface';
import * as nodemailer from 'nodemailer';
import { UserDocument } from './user.schema';
import { FactService } from "../fact/fact.service";
import * as bcrypt from 'bcrypt'
import { UpdatePasswordDto } from "./dtos/update-password.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => FactService))
    private readonly factsService: FactService, // Inject UsersService
  ) {}
  _getUserDetails(user: UserDocument): UserDetails {
    return {
      id: user._id as string,
      name: user.name,
      email: user.email,
    };
  }
  async applyCode(userId: Types.ObjectId, codeId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.ltdCodes.length === 5) {
      throw new BadRequestException('User has already redeemed the maximum of 5 codes.');
    }
    user.credits += 50;
    user.ltdCodes.push(codeId as any);
    await user.save();
    return user;
  }
  async removeLtdCode(userId: Types.ObjectId, codeId: string){
    const user = await this.userModel.findById(userId);
    const codeIndex = user.ltdCodes.indexOf(codeId as any);
    if (codeIndex === -1) throw new NotFoundException('Code not associated with user');
    user.ltdCodes.splice(codeIndex, 1);
    await user.save();
  }
  async getBasicUser(userId:string){
    const u=await this.findById2(userId);
    return {id:u._id,email:u.email,name:u.name,credits:u.credits,subscription:u.subscription}
  }
  getAllUsers(){
    return this.userModel.find().exec()
  }
  async addCredits(userId: string, amount: number) {
    // Validate userId and amount
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Find the user
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add credits
    user.credits += amount;

    // Save the updated user
    await user.save();

    return user; // Return the updated user
  }
  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto){
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // Check if the current password matches the stored password
    const isMatch = await bcrypt.compare(updatePasswordDto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    return user;
  }
  async updateUser(userId: string, updateUserDto: UpdatePasswordDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateUserDto },
      { new: true, useFindAndModify: false } // new: true returns the modified document
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return updatedUser;
  }
  async makeSearch(userId:string,factId:string){
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const u=await this.findById2(userId)
    if (u.credits<=0) throw new ForbiddenException("You don't have credits to make a search");
    u.credits=u.credits-1;
    u.facts.push(factId as any);
    await u.save()
  }
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }
  async getHistory(userId:string){
    const user =
      await this.userModel.findById(userId).populate({
        path: 'facts',
        model: 'Fact',
        options: { sort: { createdAt: -1 }, limit: 15 }, // Sort by createdAt in descending order, limit to 15
      })
    return [...user.facts].map((u:any)=>{
        return {
          ...JSON.parse(JSON.stringify(u)),
          favoriteUsers:undefined,
          isFavorite:u?.favoriteUsers?.includes(new mongoose.Types.ObjectId(userId))}
      })
  }
  async findById(id: string): Promise<UserDetails | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;
    return this._getUserDetails(user);
  }
  async findById2(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;
    return user
  }
  async create(
    name: string,
    email: string,
    hashedPassword: string,
  ): Promise<UserDocument> {
    const newUser = new this.userModel({
      name,
      email,
      password: hashedPassword,
    });
    return newUser.save();
  }
  async addFavorite(userId: string, factId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(factId)) {
      throw new BadRequestException('Invalid fact ID');
    }

    const user = await this.userModel
      .findById(userId).populate("favoriteFacts");
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const fact:any = await this.factsService.findById(factId);
    if (!fact) {
      throw new NotFoundException('Fact not found');
    }
    if (user.favoriteFacts.includes(fact._id)) {
      throw new BadRequestException('Fact is already a favorite');
    }
    fact.favoriteUsers.push(userId)
    await fact.save();
    user.favoriteFacts.push(fact._id);
    return user.save();
  }

  // Remove a fact from user's favorites
  async removeFavorite(userId: string, factId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(factId)) {
      throw new BadRequestException('Invalid fact ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const factIndex = user.favoriteFacts.indexOf(factId as any);
    if (factIndex === -1) {
      throw new BadRequestException('Fact is not in favorites');
    }
    const fact=await this.factsService.findById(factId);
      const userIndex=fact.favoriteUsers.indexOf(userId as any)
    fact.favoriteUsers.splice(userIndex,1)
        user.favoriteFacts.splice(factIndex, 1);
      await fact.save();
    return user.save();
  }

  // Get all favorite facts for a user
  async getFavoriteFacts(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId).populate({
      path: 'favoriteFacts',
      model: 'Fact',
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.favoriteFacts.map(el=>{
      return {...JSON.parse(JSON.stringify(el)),isFavorite:true}
    });
  }
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new BadRequestException('User not found');

    const token = uuidv4();
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);

    user.resetToken = token;
    user.resetTokenExpiration = expiration;
    await user.save();

    await this.sendResetEmail(email, token);
  }
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: new Date() }, // Check token hasn't expired
    });

    if (!user) throw new BadRequestException('Invalid or expired token');

    user.password = await bcrypt.hash(newPassword, 12)
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();
  }
  async sendResetEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // e.g., 'Gmail', 'Yahoo', etc.
      auth: {
        user: 'vanayfefilov777@gmail.com', // replace with your email
        pass: 'lomo lrcf czdb ygbk', // replace with your email password
      },
    });
    const resetUrl = `https://factify-ochre.vercel.app/reset-password/${token}`;

    const mailOptions = {
      from: '"Factify Support" <your-email@gmail.com>',
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please use the following link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);
  }
}
