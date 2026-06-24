import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

/**
 * Repository untuk akses data review aplikasi di database.
 * Menyimpan review yang diberikan pengguna tentang aplikasi SEAPEDIA.
 */
@Injectable()
export class ReviewRepository {
  constructor(private prisma: PrismaService) {}

  async createReview(reviewDto: CreateReviewDto) {
    return this.prisma.applicationReview.create({
      data: reviewDto,
    });
  }

  async findAllReview() {
    return this.prisma.applicationReview.findMany();
  }
}
