import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DriverReviewRepository {
  constructor(private prisma: PrismaService) {}

  async createReview(data: {
    driverId: string;
    buyerId: string;
    orderId: string;
    rating: number;
    comment: string;
  }) {
    return this.prisma.driverReview.create({ data });
  }

  async findReviewByOrder(orderId: string) {
    return this.prisma.driverReview.findUnique({
      where: { orderId },
    });
  }

  async findReviewsByDriver(driverId: string) {
    return this.prisma.driverReview.findMany({
      where: { driverId },
      include: {
        buyer: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriverReviewStats(driverId: string) {
    const result = await this.prisma.driverReview.aggregate({
      where: { driverId },
      _count: { id: true },
      _avg: { rating: true },
    });
    return {
      reviewCount: result._count.id,
      averageRating: result._avg.rating ?? 0,
    };
  }
}
