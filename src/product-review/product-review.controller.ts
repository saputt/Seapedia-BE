import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { StoreService } from 'src/store/store.service';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleName } from '@prisma/client';
import { RoleGuard } from 'src/common/guards/role.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Product Reviews')
@Controller('products/:productId/reviews')
export class ProductReviewController {
  constructor(private reviewService: ProductReviewService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard(RoleName.BUYER))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a product (Buyer)' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or already reviewed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Buyer only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createReview(
    @Param('productId', ParseUUIDPipe) productId: string,
    @GetUser('id') buyerId: string,
    @Body() dto: CreateProductReviewDto,
  ) {
    const review = await this.reviewService.createReview(
      productId,
      buyerId,
      dto,
    );
    return { message: 'review created', data: review };
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews for a product (public)' })
  @ApiResponse({ status: 200, description: 'Reviews list' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getReviews(@Param('productId', ParseUUIDPipe) productId: string) {
    const result = await this.reviewService.getProductReviews(productId);
    return { message: 'reviews fetched', data: result };
  }
}

@ApiTags('Seller Reviews')
@Controller('reviews')
export class SellerReviewController {
  constructor(private reviewService: ProductReviewService) {}

  @Get('seller')
  @UseGuards(JwtAuthGuard, RoleGuard(RoleName.SELLER))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reviews for the seller store products' })
  @ApiResponse({ status: 200, description: 'Seller reviews list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSellerReviews(@GetUser('id') userId: string) {
    const result = await this.reviewService.getSellerReviews(userId);
    return { message: 'seller reviews fetched', data: result };
  }
}

@ApiTags('Store Reviews')
@Controller('stores')
export class StoreReviewController {
  constructor(
    private reviewService: ProductReviewService,
    private storeService: StoreService,
  ) {}

  @Get(':storeId/reviews')
  @ApiOperation({ summary: 'Get all reviews for a store (public)' })
  @ApiResponse({ status: 200, description: 'Store reviews list' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreReviews(@Param('storeId', ParseUUIDPipe) storeId: string) {
    await this.storeService.findStoreOrThrow(storeId);
    const result = await this.reviewService.getStoreReviews(storeId);
    return { message: 'store reviews fetched', data: result };
  }
}
