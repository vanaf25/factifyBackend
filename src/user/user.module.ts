import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';

import { UserController } from './user.controller';
import { UserSchema } from './user.schema';
import { UserService } from './user.service';
import { FactModule } from "../fact/fact.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(()=>FactModule)
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
