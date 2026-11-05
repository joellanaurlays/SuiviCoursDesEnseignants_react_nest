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
import { NiveauService } from './niveau.service.js';
import { CreateNiveauDto } from './dto/create-niveau.dto.js';
import { UpdateNiveauDto } from './dto/update-niveau.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/roles.enum.js';
import { DbExceptionFilter } from '../common/db-exception.filter.js';

@UseFilters(DbExceptionFilter)
@Controller('niveaux')
export class NiveauController {
  constructor(private readonly service: NiveauService) {}

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
  create(@Body() dto: CreateNiveauDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SCOLARITE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNiveauDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SCOLARITE)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
