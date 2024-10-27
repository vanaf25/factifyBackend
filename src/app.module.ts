import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FactModule } from './fact/fact.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from "@nestjs/mongoose";
import { CouponCodeModule } from './coupon-code/coupon-code.module';
import { LtdCodeModule } from './ltd-code/ltd-code.module';
import { SettingsModule } from './settings/settings.module';
const uri="mongodb+srv://vanayfefilov777:p27qqg60oh@cluster0.tzaag.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
@Module({
  imports: [
    MongooseModule.forRoot(uri), // Ensure MONGODB_URI is set in .env
    FactModule, AuthModule, UserModule, CouponCodeModule, LtdCodeModule, SettingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
