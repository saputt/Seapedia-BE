import { Body, Controller } from "@nestjs/common";
import { DiscountService } from "./discount.service";
import { FindDiscountDto } from "./dto/find-discount.dto";

@Controller()
export class DiscountController {
    constructor(private discountService : DiscountService) {}

    async findDiscountByCode(@Body() dto : FindDiscountDto) {
        const findDiscountByCodeResult = await this.discountService.isDiscountStillAvailable(dto.code)
        return {
            message : "find discount success",
            data : findDiscountByCodeResult
        }
    }
}