import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EnseignementsModule } from './enseignements/enseignements.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, EnseignementsModule, AuthModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}