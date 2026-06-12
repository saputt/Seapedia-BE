import { Injectable } from "@nestjs/common";
import { ReviewRepository } from "./review.repository";
import { CreateReviewDto } from "./dto/create-review.dto";

@Injectable()
export class ReviewService {
    constructor(private reviewRepo : ReviewRepository) {}

    async createReview(reviewDto : CreateReviewDto) {
        const review = await this.reviewRepo.createReview(reviewDto)
        return {
            review
        }
    }

    async getAllReviews() {
        const reviews = await this.reviewRepo.findAllReview()
        return {
            reviews,
            total: reviews.length
        }
    }
}