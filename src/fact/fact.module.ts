import { forwardRef, Module } from "@nestjs/common";
import { FactService } from './fact.service';
import { FactController } from './fact.controller';
import { MongooseModule } from "@nestjs/mongoose";
import { FactSchema } from "./fact.schema";
import { UserModule } from "../user/user.module";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports:[
    MongooseModule.forFeature([{ name: 'Fact', schema:FactSchema }]),
    forwardRef(()=>UserModule),
    SettingsModule
  ],
  controllers: [FactController],
  providers: [FactService],
  exports:[FactService]
})
export class FactModule {}
