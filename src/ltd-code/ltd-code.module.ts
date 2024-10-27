import { Module } from '@nestjs/common';
import { LtdCodeService } from './ltd-code.service';
import { LtdCodeController } from './ltd-code.controller';
import { MongooseModule } from "@nestjs/mongoose";
import { LtdCode, LtdCodeSchema } from "./entities/ltd-code.entity";
import { UserModule } from "../user/user.module";

@Module({
  imports:[
    MongooseModule.forFeature([{ name:LtdCode.name, schema: LtdCodeSchema }]),
    UserModule
  ],
  controllers: [LtdCodeController],
  providers: [LtdCodeService],
  exports:[LtdCodeService]
})
export class LtdCodeModule {}
