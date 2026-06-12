import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Injectable()
export class ReviewRepository {
    constructor(private prisma : PrismaService) {}

    async createReview(reviewDto : CreateReviewDto) {
        return this.prisma.applicationReview.create({
            data : reviewDto
        })
    }

    async findAllReview() {
        return this.prisma.applicationReview.findMany()
    }
}