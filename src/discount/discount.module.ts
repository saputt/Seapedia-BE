import { Module } from "@nestjs/common";
import { DiscountService } from "./discount.service";
import { DiscountRepository } from "./discount.repository";
import { DiscountController } from "./discount.controller";

@Module({
    providers : [DiscountService, DiscountRepository],
    controllers : [DiscountController],
    exports : [DiscountService]
})
export class DiscountModule {}