import { PartialType } from '@nestjs/mapped-types';
import { ExistingUserDTO } from "./existing-user.dto";
export class UpdateUserDto extends PartialType(ExistingUserDTO) {}
