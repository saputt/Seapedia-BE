import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { BuyerGuard } from "src/common/guards/buyer.guard";
import { OrderSummaryDto } from "./dto/order-summary.dto";
import { OrderStatus, RoleName } from "@prisma/client";
import { UpdateStatusOrderDto } from "./dto/update-status-order.dto";
import { SellerGuard } from "src/common/guards/seller.guard";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrderController {
    constructor(private orderService : OrderService) {}

    @Post("checkout")
    @UseGuards(BuyerGuard)
    async checkout(@Body() dto : CheckoutDto, @GetUser("id") userId : string) {
        const checkoutResult = await this.orderService.checkout(dto, userId)
        return {
            message : `checkout success`,
            data : checkoutResult
        }
    }

    @Get("summary")
    @UseGuards(BuyerGuard)
    async orderSummary(@Body() dto : OrderSummaryDto, @GetUser("id") userId : string) {
        const orderSummaryResult = await this.orderService.orderSummary(dto, userId)
        return {
            message : "get order summary success",
            data : orderSummaryResult
        }
    }

    @Patch(":orderId/progress")
    async updateStatusOrder(@Body() dto : UpdateStatusOrderDto, @Param("orderId") orderId : string, @GetUser("id") userId : string, @GetUser("role") userRole : RoleName) {
        const updateStatusOrderResult = await this.orderService.updateStatusOrder(dto, orderId, userId, userRole)
        return {
            message : "update status order success",
            data : updateStatusOrderResult
        }
    }

    @Patch(":orderId/cancel")
    @UseGuards(BuyerGuard)
    async cancelOrder(@Param("orderId") orderId : string, @GetUser('id') userId : string) {
        const cancelOrderResult = await this.orderService.cancelOrder(userId, orderId)
        return {
            message : "cancel order success",
            data : cancelOrderResult
        }
    }
}