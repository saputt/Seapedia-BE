import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverReviewRepository } from './driver-review.repository';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';
import { OrderRepository } from 'src/order/order.repository';
import { OrderStatus } from '@prisma/client';
import { sanitizeInput } from 'src/common/helpers/sanitize.helper';

@Injectable()
export class DriverReviewService {
  constructor(
    private reviewRepo: DriverReviewRepository,
    private orderRepo: OrderRepository,
  ) {}

  async createReview(
    orderId: string,
    buyerId: string,
    dto: CreateDriverReviewDto,
  ) {
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId)
      throw new ForbiddenException('This order does not belong to you');
    if (order.status !== OrderStatus.DELIVERED)
      throw new BadRequestException('Can only review delivered orders');
    if (!order.driverJob)
      throw new BadRequestException('No driver assigned to this order');

    const existing = await this.reviewRepo.findReviewByOrder(orderId);
    if (existing)
      throw new BadRequestException(
        'You have already reviewed the driver for this order',
      );

    return this.reviewRepo.createReview({
      driverId: order.driverJob.driverId,
      buyerId,
      orderId,
      rating: dto.rating,
      comment: dto.comment ? sanitizeInput(dto.comment) : '',
    });
  }

  async getReviewByOrder(orderId: string) {
    return this.reviewRepo.findReviewByOrder(orderId);
  }

  async getDriverReviews(driverId: string) {
    return this.reviewRepo.findReviewsByDriver(driverId);
  }

  async getMyReviewStats(driverId: string) {
    const [reviews, stats] = await Promise.all([
      this.reviewRepo.findReviewsByDriver(driverId),
      this.reviewRepo.getDriverReviewStats(driverId),
    ]);
    return { reviews, total: reviews.length, stats };
  }
}
