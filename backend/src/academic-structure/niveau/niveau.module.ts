import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Niveau } from './niveau.entity.js';
import { NiveauService } from './niveau.service.js';
import { NiveauController } from './niveau.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Niveau])],
  controllers: [NiveauController],
  providers: [NiveauService],
  exports: [NiveauService],
})
export class NiveauModule {}
