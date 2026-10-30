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
import { CycleService } from './cycle.service.js';
import { CreateCycleDto } from './dto/create-cycle.dto.js';
import { UpdateCycleDto } from './dto/update-cycle.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/roles.enum.js';
import { DbExceptionFilter } from '../common/db-exception.filter.js';

@UseFilters(DbExceptionFilter)
@Controller('cycles')
export class CycleController {
  constructor(private readonly service: CycleService) {}

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
  create(@Body() dto: CreateCycleDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SCOLARITE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCycleDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SCOLARITE)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
