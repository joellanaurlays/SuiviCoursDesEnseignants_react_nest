import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PassportModule } from '@nestjs/passport';

@Module({
    imports: [
        PrismaModule,
        PassportModule.register({
          defaultStrategy: 'jwt',
        }),
      ],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}