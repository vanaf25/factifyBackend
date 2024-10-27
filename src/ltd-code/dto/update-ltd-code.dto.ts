import { PartialType } from '@nestjs/mapped-types';
import { CreateLtdCodeDto } from './create-ltd-code.dto';

export class UpdateLtdCodeDto extends PartialType(CreateLtdCodeDto) {}
