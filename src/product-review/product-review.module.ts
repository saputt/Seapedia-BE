import { Module } from '@nestjs/common';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';
import { ProductReviewRepository } from './product-review.repository';
import { ProductModule } from 'src/product/product.module';
import { OrderModule } from 'src/order/order.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ProductReviewController],
  providers: [ProductReviewService, ProductReviewRepository],
  imports: [ProductModule, OrderModule, PrismaModule],
})
export class ProductReviewModule {}
