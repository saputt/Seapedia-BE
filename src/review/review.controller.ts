import { Body, Controller, Get, Post } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post()
  @ApiOperation({ summary: 'Submit an application review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Validation error (invalid rating, name length, or empty comment)',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (rate limit exceeded)',
  })
  async createReview(@Body() dto: CreateReviewDto) {
    const createReviewResult = await this.reviewService.createReview(dto);
    return {
      message: 'create review successful',
      data: createReviewResult,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all application reviews' })
  @ApiResponse({ status: 200, description: 'Reviews list retrieved' })
  async getAllReviews() {
    const getAllReviews = await this.reviewService.getAllReviews();
    return {
      message: 'get all reviews success',
      data: getAllReviews,
    };
  }
}
