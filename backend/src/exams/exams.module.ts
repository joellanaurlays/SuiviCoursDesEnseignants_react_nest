import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { SessionExamen } from './entities/session-examen.entity.js';
import { Examen } from './entities/examen.entity.js';
import { Alerte } from './entities/alerte.entity.js';
import { ExamsService } from './exams.service.js';
import { ExamsController } from './exams.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionExamen, Examen, Alerte]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
