import {
  BadRequestException, ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import mongoose, { Model, Types } from "mongoose";
import { UserDetails } from './user-details.interface';
import { UserDocument } from './user.schema';
import { FactService } from "../fact/fact.service";
import * as bcrypt from 'bcrypt'
import { UpdatePasswordDto } from "./dtos/update-password.dto";
import { ConfigService } from "@nestjs/config";
import { LtdCodeService } from "../ltd-code/ltd-code.service";
@Injectable()
export class UserService {
  private readonly brevoClient: SibApiV3Sdk.TransactionalEmailsApi;
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => FactService))
    private readonly factsService: FactService,
    @Inject(forwardRef(() => LtdCodeService))
    private readonly ltdCodeService: LtdCodeService,
    private configService: ConfigService,

  ) {
    this.brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
    SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =this.configService.get<string>('BREVO_API_KEY');
  }
  async findByStripeCustomerId(customerId: string): Promise<any | null> {
    return this.userModel.findOne({ stripeCustomerId: customerId }).exec();
  }
  _getUserDetails(user: UserDocument): UserDetails {
    return {
      id: user._id as string,
      name: user.name,
      email: user.email,
      role:user.role,
    };
  }
  async changeSubscription(userId: string, data:
    {plan:string,customerId:string,subscriptionId:string,type:string}) {
    const newPlan=data.plan;
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plans = {
      'starter': 10,
      'pro': 100,
      'business': 300,
    };

    if (!plans[newPlan]) {
      throw new BadRequestException('Invalid subscription plan');
    }
    function getSubscriptionEndDate(type:string) {
      const endDate = new Date(); // Create a copy of the start date

      if (type === 'month') {
        endDate.setMonth(endDate.getMonth() + 1); // Add 1 month
      } else if (type === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year
      }

      return endDate;
    }
    // Update subscription, credits, and set the subscription start date
    user.subscription = newPlan;
    user.subscriptionId=data.subscriptionId;
    user.stripeCustomerId=data.customerId;
    user.credits += plans[newPlan];
    user.subscriptionStartDate = new Date(); // Start date of the new subscription
    user.lastCreditUpdate = new Date();
    user.subscriptionType=data.type
    user.subscriptionEndDate=getSubscriptionEndDate(data.type);
    user.subscriptionIsActive=true;
    // Reset last update to today
    await user.save();
    await this.sendConfirmationSubscriptionEmail(user.email,user.name,
      {plan:newPlan,credits:plans[newPlan],type:data.type})
    return user;
  }
  async creditsBasedOnSubscriptionDate() {
    console.log('user  cron Handle!');
    const plans = {
      'starter': 10,
      'pro': 100,
      'business': 150,
    };

    const today = new Date();
    const users = await this.userModel.find();

    for (const user of users) {
      if (!user.subscriptionStartDate || user.subscriptionType==="month") continue;
      function isPastOrToday(date) {
        if(date){
          const today = new Date();
          const toDateFormat=new Date(date)
          today.setHours(0, 0, 0, 0);
          toDateFormat.setHours(0, 0, 0, 0);
          return toDateFormat <= today;
        }
        return false
      }

      console.log(`${user.email}:`,user.subscriptionEndDate);
      if(!user.subscriptionIsActive && isPastOrToday(user.subscriptionEndDate)){
        await this.resetUserSubscription(user._id as string);
      }
      // Check if today matches the subscription renewal day
      const subscriptionDay = user.subscriptionStartDate.getDate();
      const currentDay = today.getDate();

      if (subscriptionDay === currentDay) {
        console.log('credits gets:',user.email);
        user.credits += plans[user.subscription] || 0;
        user.lastCreditUpdate = today;
        await this.sendSubscriptionEmail(user.email,user.name,{plan:user.subscription,
          credits:plans[user.subscription]})
        await user.save();
      }
    }
  }
  async updateMonthlyCredits() {
    const users = await this.userModel.find({ isActive: true });

    users.forEach(async (user) => {
      const currentDate = new Date();

      // Check if it's time to update credits (monthly)
      if (user.lastCreditUpdate && user.lastCreditUpdate.getMonth() === currentDate.getMonth()) {
        return; // Skip if credits have already been updated this month
      }

      let additionalCredits = 0;

      switch (user.subscription) {
        case 'Starter plan':
          additionalCredits = 10;
          break;
        case 'Pro plan':
          additionalCredits = 100;
          break;
        case 'Business plan':
          additionalCredits = 500;
          break;
      }

      // Update user credits and last credit update date
      user.credits += additionalCredits;
      user.lastCreditUpdate = currentDate;

      await user.save();
    });
  }
  async resetUserSubscription(userId:string){
    const u=await this.findById2(userId);
    u.subscription="";
    u.subscriptionId="";
    u.subscriptionType=""
    u.subscriptionIsActive=false
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
    return {id:u._id,email:u.email,name:u.name,
      credits:u.credits,subscription:u.subscription,
      subscriptionType:u.subscriptionType}
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
  async updateUser(userId: string, updateUserDto: any) {
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
    console.log('operations in userService all successsul!');
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
    return user?.facts?.length ?  [...user.facts].map((u:any)=>{
      return {
        ...JSON.parse(JSON.stringify(u)),
        favoriteUsers:undefined,
        isFavorite:u?.favoriteUsers?.includes(new mongoose.Types.ObjectId(userId))}
    }):[]
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
  async sendWelcomeEmail(email: string, name: string) {
    await this.emailTemplate(email,`Welcome to Factify!`,`
        <p>Hello ${name},</p>
        <p>Welcome to Factify! We're glad to have you with us.</p>
        <p>Enjoy discovering new facts!</p>
      `);
  }
  async cancelSubscription(userId:string){
    const u=await this.findById2(userId);
    console.log('u:s',u);
    if(u.subscriptionType==="month"){
      u.subscription="";
      u.subscriptionId="";
      u.subscriptionType=""
      u.subscriptionIsActive=false
      await u.save();
    }
    else  {
      u.subscriptionIsActive=false
      await u.save();
    }
    return u;
  }
  async sendConfirmationSubscriptionEmail(email: string, name: string,planData:any) {
    await this.emailTemplate(email,`You activate a ${planData.plan}`,`
        <p>Hello ${name},</p>
        <p>Based on your ${planData.plan} plan, You will receive every month
         a ${planData.credits} credits!</p>
         <p>You will must to pay for this subscription every ${planData.type}</p>
      `)
  }
  async sendSubscriptionEmail(email: string, name: string,planData:any) {
    await this.emailTemplate(email,"You recevied the credits!",`
        <p>Hello ${name},</p>
        <p>Based on your ${planData.plan} plan You received a ${planData.credits} credits!</p>
      `)
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
    const savedUser = await newUser.save();
    await this.sendWelcomeEmail(email, name);
    return savedUser;
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
  async removeUser(userId:string){
    console.log('id:',userId);
   const user= await this.findById2(userId)
      await this.cancelSubscription(userId)
      await this.factsService.deleteUserFacts(user.facts)
      await this.ltdCodeService.removeUserCodes(user.ltdCodes)
      await this.userModel.findByIdAndDelete(userId)
      await this.sendDeletedEmail(user.email,user.name)
      return {message:"User deleted successfully!"}
  }
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
    const resetUrl = `https://factify-ochre.vercel.app/reset-password/${token}`;
    const content=`
        <p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>If you didn’t request this, please ignore this email.</p>
      `
    await this.emailTemplate(email,"Password Reset Request",content)
  }
  async sendDeletedEmail(email:string,name:string){
    const content=`
<h3>Hi,${name}</h3>
  <p>
      We’re writing to let you know that your account has been permanently deleted.  
      If this was a mistake or you need assistance, please <a href="mailto:contactus@factifygpt.com">contact contactus@factifygpt.com</a>.
    </p>`
    await this.emailTemplate(email,"Account Deleted",content)
  }
  async emailTemplate(email:string,subject:string,content:string){
    const emailOptions = {
      to: [{ email }],
      sender: { name: "Factify Support", email: "noreply@factifygpt.com" }, // Update with your email domain
      subject: subject,
      htmlContent: content
    };
    try {
      await this.brevoClient.sendTransacEmail(emailOptions);
    } catch (error) {
      console.log('e:',error);
      throw new BadRequestException("Failed to send reset email");
    }
  }
}