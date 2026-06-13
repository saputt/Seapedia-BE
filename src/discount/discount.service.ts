import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DiscountRepository } from "./discount.repository";

@Injectable()
export class DiscountService {
    constructor(private discountRepo : DiscountRepository) {}

    async findDiscountOrThrow(discountId : string) {
        const discount = await this.discountRepo.findDiscountById(discountId)
        if (!discount) throw new NotFoundException("discount not found")
        return discount
    }

    async isDiscountStillAvailable(discountCode : string) {
        const discount = await this.discountRepo.findDiscountByCode(discountCode)
        if (!discount) throw new NotFoundException("discount not found")
        if (discount.usedCount >= discount.maxUses) throw new BadRequestException("voucher is not available")
        return discount
    }
}