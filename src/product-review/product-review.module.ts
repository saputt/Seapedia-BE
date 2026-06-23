import { Module } from '@nestjs/common';
import {
  ProductReviewController,
  SellerReviewController,
  StoreReviewController,
} from './product-review.controller';
import { ProductReviewService } from './product-review.service';
import { ProductReviewRepository } from './product-review.repository';
import { ProductModule } from 'src/product/product.module';
import { OrderModule } from 'src/order/order.module';
import { StoreModule } from 'src/store/store.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ProductReviewController, SellerReviewController, StoreReviewController],
  providers: [ProductReviewService, ProductReviewRepository],
  imports: [ProductModule, OrderModule, StoreModule, PrismaModule],
})
export class ProductReviewModule {}
