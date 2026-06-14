import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { BuyerGuard } from "src/common/guards/buyer.guard";
import { OrderSummaryDto } from "./dto/order-summary.dto";
import { RoleName } from "@prisma/client";
import { UpdateStatusOrderDto } from "./dto/update-status-order.dto";
import { DriverGuard } from "src/common/guards/driver.guard";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrderController {
    constructor(private orderService : OrderService) {}

    @Get("available-jobs")
    @UseGuards(DriverGuard)
    async getAvailableJobs() {
        const getAvailableJobsResult = await this.orderService.getAvailableJobs()
        return {
            message : "get available jobs success",
            data : getAvailableJobsResult
        }
    }

    @Get()
    @UseGuards(BuyerGuard)
    async getAllOrders(@GetUser('id') userId : string) {
        const getAllOrdersResult = await this.orderService.getAllOrders(userId)
        return {
            message : "get all orders success",
            data : getAllOrdersResult
        }
    }

    @Get(":orderId")
    @UseGuards(BuyerGuard)
    async getOrderById(@Param("orderId") orderId : string, @GetUser('id') userId : string) {
        const getOrderByIdResult = await this.orderService.getOrderById(orderId, userId)
        return {
            message : `get order with id : ${orderId} success`,
            data : getOrderByIdResult
        }
    }

    @Post("checkout")
    @UseGuards(BuyerGuard)
    async checkout(@Body() dto : CheckoutDto, @GetUser("id") userId : string) {
        const checkoutResult = await this.orderService.checkout(dto, userId)
        return {
            message : `checkout success`,
            data : checkoutResult
        }
    }

    @Post("summary")
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
        const updateStatusOrderResult = await this.orderService.updateStatusOrder(dto.storeId, orderId, userId, userRole)
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

    @Patch(":orderId/take-job")
    @UseGuards(DriverGuard)
    async takeJob(@GetUser("id") driverId : string, @GetUser("role") userRole : RoleName, @Param("orderId") orderId : string) {
        const takeJobResult = await this.orderService.takeJob(orderId, driverId, userRole)
        return {
            message : "",
            data : takeJobResult
        }
    }
}