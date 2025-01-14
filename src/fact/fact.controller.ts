import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { FactService } from './fact.service';
import { CreateFactDto } from './dto/create-fact.dto';
import { UpdateFactDto } from './dto/update-fact.dto';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetUser } from "../auth/decorators/get-user-decorator";

@Controller('fact')
export class FactController {
  constructor(private readonly factService: FactService) {}
  @UseGuards(JwtGuard)
  @Post()
  create(@Body() createFactDto: CreateFactDto, @GetUser() user:any) {
    return this.factService.create(createFactDto,user.id);
  }

  @Get()
  findAll() {
    console.log('findAll!!');
    return this.factService.findAll();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.factService.findOne(+id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFactDto: UpdateFactDto) {
    return this.factService.update(+id, updateFactDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@GetUser() {id}:any, @Param('id') factId: string) {
  return this.factService.deleteFact(factId,id);
  }
}
