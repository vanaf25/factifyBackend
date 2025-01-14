import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FactModule } from './fact/fact.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from "@nestjs/mongoose";
import { CouponCodeModule } from './coupon-code/coupon-code.module';
import { LtdCodeModule } from './ltd-code/ltd-code.module';
import { SettingsModule } from './settings/settings.module';
import { StripeModule } from './stripe/stripe.module';
import { ScheduleModule } from "@nestjs/schedule";
const mongoTestURL="mongodb+srv://vanayfefilov777:p27qqg60oh@cluster0.tzaag.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//const realMongoUrl=mongoTestURL
const uri=mongoTestURL
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(uri),
    ScheduleModule.forRoot(),
    FactModule, AuthModule, UserModule,
    CouponCodeModule, LtdCodeModule, SettingsModule, StripeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
