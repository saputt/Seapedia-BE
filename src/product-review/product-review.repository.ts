import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Repository untuk akses data review produk di database.
 * Menangani pembuatan review, pencarian review berdasarkan pesanan/produk,
 * dan penghitungan statistik review (rating rata-rata dan jumlah review).
 */
@Injectable()
export class ProductReviewRepository {
  constructor(private prisma: PrismaService) {}

  async createReview(data: {
    productId: string;
    buyerId: string;
    orderId: string;
    rating: number;
    comment: string;
  }) {
    return this.prisma.productReview.create({ data });
  }

  async findReviewByOrderAndProduct(orderId: string, productId: string) {
    return this.prisma.productReview.findUnique({
      where: { orderId_productId: { orderId, productId } },
    });
  }

  async findReviewsByProduct(productId: string) {
    return this.prisma.productReview.findMany({
      where: { productId },
      include: {
        buyer: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReviewsByStoreOwner(userId: string) {
    return this.prisma.productReview.findMany({
      where: {
        product: {
          store: { userId },
        },
      },
      include: {
        buyer: { select: { id: true, username: true } },
        product: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReviewStats(productIds: string[]) {
    const stats = await this.prisma.productReview.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _count: { id: true },
      _avg: { rating: true },
    });
    return stats;
  }

  async getReviewStatsByProduct(productId: string) {
    const result = await this.prisma.productReview.aggregate({
      where: { productId },
      _count: { id: true },
      _avg: { rating: true },
    });
    return {
      reviewCount: result._count.id,
      averageRating: result._avg.rating ?? 0,
    };
  }
}
