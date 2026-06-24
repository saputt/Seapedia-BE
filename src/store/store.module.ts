import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreRepository } from './store.repository';
import { StoreService } from './store.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [StoreController],
  providers: [StoreRepository, StoreService],
  exports: [StoreService],
  imports: [PrismaModule, AuthModule, StorageModule],
})
export class StoreModule {}
