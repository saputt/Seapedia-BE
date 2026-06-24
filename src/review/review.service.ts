import { Injectable } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto } from './dto/create-review.dto';

/**
 * Service untuk mengelola review aplikasi (bukan review produk).
 * Review ini ditulis oleh pengguna/guest untuk memberikan feedback tentang aplikasi SEAPEDIA.
 * Endpoint ini sengaja tidak dilindungi auth agar siapa saja bisa memberikan review.
 */
@Injectable()
export class ReviewService {
  constructor(private reviewRepo: ReviewRepository) {}

  async createReview(reviewDto: CreateReviewDto) {
    return await this.reviewRepo.createReview(reviewDto);
  }

  async getAllReviews() {
    const reviews = await this.reviewRepo.findAllReview();
    return {
      reviews,
      total: reviews.length,
    };
  }
}
