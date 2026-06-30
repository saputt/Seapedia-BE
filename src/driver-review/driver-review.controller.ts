import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DriverReviewService } from './driver-review.service';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleName } from '@prisma/client';
import { RoleGuard } from 'src/common/guards/role.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Driver Reviews')
@Controller('orders/:orderId/driver-review')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DriverReviewController {
  constructor(private reviewService: DriverReviewService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post()
  @UseGuards(RoleGuard(RoleName.BUYER))
  @ApiOperation({ summary: 'Create a review for the driver (Buyer)' })
  @ApiResponse({ status: 201, description: 'Driver review created' })
  @ApiResponse({ status: 400, description: 'Validation error or already reviewed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Buyer only' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createReview(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @GetUser('id') buyerId: string,
    @Body() dto: CreateDriverReviewDto,
  ) {
    const review = await this.reviewService.createReview(orderId, buyerId, dto);
    return { message: 'driver review created', data: review };
  }

  @Get()
  @ApiOperation({ summary: 'Get driver review for an order' })
  @ApiResponse({ status: 200, description: 'Driver review retrieved' })
  async getReview(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const review = await this.reviewService.getReviewByOrder(orderId);
    return { message: 'driver review fetched', data: review };
  }
}

@ApiTags('Driver My Reviews')
@Controller('reviews/driver')
@UseGuards(JwtAuthGuard, RoleGuard(RoleName.DRIVER))
@ApiBearerAuth()
export class DriverMyReviewsController {
  constructor(private reviewService: DriverReviewService) {}

  @Get()
  @ApiOperation({ summary: 'Get my driver reviews and stats (Driver)' })
  @ApiResponse({ status: 200, description: 'Driver reviews retrieved' })
  async getMyReviews(@GetUser('id') driverId: string) {
    const result = await this.reviewService.getMyReviewStats(driverId);
    return { message: 'my driver reviews fetched', data: result };
  }
}
