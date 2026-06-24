import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { StoreModule } from 'src/store/store.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  imports: [StoreModule, PrismaModule, StorageModule],
  exports: [ProductService],
})
export class ProductModule {}
