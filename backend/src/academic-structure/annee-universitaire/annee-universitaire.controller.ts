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
import { AnneeUniversitaireService } from './annee-universitaire.service.js';
import { CreateAnneeUniversitaireDto } from './dto/create-annee-universitaire.dto.js';
import { UpdateAnneeUniversitaireDto } from './dto/update-annee-universitaire.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/roles.enum.js';
import { DbExceptionFilter } from '../common/db-exception.filter.js';

@UseFilters(DbExceptionFilter)
@Controller('annees-universitaires')
export class AnneeUniversitaireController {
  constructor(private readonly service: AnneeUniversitaireService) {}

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
  create(@Body() dto: CreateAnneeUniversitaireDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SCOLARITE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnneeUniversitaireDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SCOLARITE)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
