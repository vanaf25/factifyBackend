import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';

import { UserController } from './user.controller';
import { UserSchema } from './user.schema';
import { UserService } from './user.service';
import { FactModule } from "../fact/fact.module";
import { ConfigModule } from "@nestjs/config";
import { LtdCodeModule } from "../ltd-code/ltd-code.module";

@Module({
  imports: [ConfigModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(()=>FactModule),
    forwardRef(()=>LtdCodeModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
