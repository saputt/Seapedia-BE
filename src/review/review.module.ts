import { Module } from "@nestjs/common";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";
import { ReviewRepository } from "./review.repository";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    controllers : [ReviewController],
    providers : [ReviewService, ReviewRepository],
    imports : [PrismaModule]
})
export class ReviewModule {}