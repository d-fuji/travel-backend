import { Module } from '@nestjs/common';
import { TravelGroupsController } from './travel-groups.controller';
import { TravelGroupsService } from './travel-groups.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TravelGroupsController],
  providers: [TravelGroupsService],
  exports: [TravelGroupsService],
})
export class TravelGroupsModule {}