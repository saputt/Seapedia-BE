import { Body, Controller, Get, Post } from "@nestjs/common";
import { ReviewService } from "./review.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService : ReviewService) {}

    @Post()
    async createReview(@Body() dto : CreateReviewDto) {
        const createReviewResult = await this.reviewService.createReview(dto)
        return {
            message : "create review successful",
            data : createReviewResult
        }
    }

    @Get()
    async getAllReviews() {
        const getAllReviews = await this.reviewService.getAllReviews()
        return {
            message : "get all reviews success",
            data : getAllReviews
        }
    }
}