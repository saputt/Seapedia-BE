import { Module } from '@nestjs/common';
import { DriverReviewController, DriverMyReviewsController } from './driver-review.controller';
import { DriverReviewService } from './driver-review.service';
import { DriverReviewRepository } from './driver-review.repository';
import { OrderModule } from 'src/order/order.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [DriverReviewController, DriverMyReviewsController],
  providers: [DriverReviewService, DriverReviewRepository],
  imports: [OrderModule, PrismaModule],
})
export class DriverReviewModule {}
