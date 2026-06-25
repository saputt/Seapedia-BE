import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductReviewRepository } from './product-review.repository';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { ProductService } from 'src/product/product.service';
import { OrderService } from 'src/order/order.service';
import { OrderStatus } from '@prisma/client';
import { sanitizeInput } from 'src/common/helpers/sanitize.helper';

/**
 * Service untuk mengelola review produk.
 * Hanya pembeli yang telah menerima pesanan (status DELIVERED) yang dapat memberikan review.
 * Satu produk hanya bisa direview sekali per pesanan (tidak ada review duplikat).
 * Review berisi rating (bintang) dan komentar.
 */
@Injectable()
export class ProductReviewService {
  constructor(
    private reviewRepo: ProductReviewRepository,
    private productService: ProductService,
    private orderService: OrderService,
  ) {}

  async createReview(
    productId: string,
    buyerId: string,
    dto: CreateProductReviewDto,
  ) {
    await this.productService.findProductOrThrow(productId);

    const order = await this.orderService.findOrderOrThrow(dto.orderId);
    if (order.buyerId !== buyerId)
      throw new BadRequestException('This order does not belong to you');
    if (order.status !== OrderStatus.DELIVERED)
      throw new BadRequestException('Can only review delivered orders');

    const hasItem = order.orderItems?.some(
      (item) => item.productId === productId,
    );
    if (!hasItem)
      throw new BadRequestException('This product is not in the given order');

    const existing = await this.reviewRepo.findReviewByOrderAndProduct(
      dto.orderId,
      productId,
    );
    if (existing)
      throw new BadRequestException(
        'You have already reviewed this product for this order',
      );

    return this.reviewRepo.createReview({
      productId,
      buyerId,
      orderId: dto.orderId,
      rating: dto.rating,
      comment: sanitizeInput(dto.comment),
    });
  }

  async getProductReviews(productId: string) {
    await this.productService.findProductOrThrow(productId);
    const reviews = await this.reviewRepo.findReviewsByProduct(productId);
    return { reviews, total: reviews.length };
  }

  async getSellerReviews(userId: string) {
    const reviews = await this.reviewRepo.findReviewsByStoreOwner(userId);
    return { reviews, total: reviews.length };
  }

  async getStoreReviews(storeId: string) {
    const [reviews, stats] = await Promise.all([
      this.reviewRepo.findReviewsByStoreId(storeId),
      this.reviewRepo.getStoreReviewStats(storeId),
    ]);
    return { reviews, total: reviews.length, stats };
  }
}
