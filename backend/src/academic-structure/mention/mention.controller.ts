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
import { MentionService } from './mention.service.js';
import { CreateMentionDto, GenererStructureDto } from './dto/create-mention.dto.js';
import { UpdateMentionDto } from './dto/update-mention.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/roles.enum.js';
import { TreeService } from '../tree/tree.service.js';
import { StructureGeneratorService } from '../tree/structure-generator.service.js';
import { DbExceptionFilter } from '../common/db-exception.filter.js';

@UseFilters(DbExceptionFilter)
@Controller('mentions')
export class MentionController {
  constructor(
    private readonly service: MentionService,
    private readonly tree: TreeService,
    private readonly generator: StructureGeneratorService,
  ) {}

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
  async create(@Body() dto: CreateMentionDto) {
    // Mention + Cycles + Niveaux + Annee + Semestres crees ensemble (transaction).
    const { mentionId, generated } = await this.generator.createMentionWithStructure(
      dto.nom,
      dto.anneeDebut,
      dto.genererStructure !== false,
    );
    const [mention] = await this.tree.tree(mentionId);
    return { ...mention, generated };
  }

  /** Arbre complet d'une mention (cycles, niveaux, annees, semestres, matieres). */
  @Get(':id/tree')
  async mentionTree(@Param('id', ParseIntPipe) id: number) {
    await this.service.findOne(id);
    return (await this.tree.tree(id))[0];
  }

  /** Genere (ou complete) la structure standard d'une mention existante, pour l'annee choisie. */
  @Roles(Role.SCOLARITE)
  @Post(':id/structure')
  async generate(@Param('id', ParseIntPipe) id: number, @Body() dto: GenererStructureDto) {
    const generated = await this.generator.generate(id, dto.anneeDebut);
    const [mention] = await this.tree.tree(id);
    return { ...mention, generated };
  }

  @Roles(Role.SCOLARITE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMentionDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SCOLARITE)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}