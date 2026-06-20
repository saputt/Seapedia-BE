import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreRepository } from './store.repository';
import { StoreService } from './store.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [StoreController],
  providers: [StoreRepository, StoreService],
  exports: [StoreService],
  imports: [PrismaModule],
})
export class StoreModule {}
