import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import { SemestreService } from './semestre.service.js';
import { CreateSemestreDto } from './dto/create-semestre.dto.js';
import { UpdateSemestreDto } from './dto/update-semestre.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/roles.enum.js';
import { DbExceptionFilter } from '../common/db-exception.filter.js';

@UseFilters(DbExceptionFilter)
@Controller('semestres')
export class SemestreController {
  constructor(private readonly service: SemestreService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles(Role.SCOLARITE)
  @Post()
  create(@Body() dto: CreateSemestreDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SCOLARITE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSemestreDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SCOLARITE)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
