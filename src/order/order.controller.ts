import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { BuyerGuard } from "src/common/guards/buyer.guard";
import { OrderSummaryDto } from "./dto/order-summary.dto";

@Controller("orders")
@UseGuards(JwtAuthGuard, BuyerGuard)
export class OrderController {
    constructor(private orderService : OrderService) {}

    @Post("checkout")
    async checkout(@Body() dto : CheckoutDto, @GetUser("id") userId : string) {
        const checkoutResult = await this.orderService.checkout(dto, userId)
        return {
            message : `checkout success`,
            data : checkoutResult
        }
    }

    @Post("summary")
    async orderSummary(@Body() dto : OrderSummaryDto, @GetUser("id") userId : string) {
        const orderSummaryResult = await this.orderService.orderSummary(dto, userId)
        return {
            message : "get order summary success",
            data : orderSummaryResult
        }
    }
}