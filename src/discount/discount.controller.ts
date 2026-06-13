import { Controller } from "@nestjs/common";
import { DiscountService } from "./discount.service";

@Controller()
export class DiscountController {
    constructor(private discountService : DiscountService) {}
}