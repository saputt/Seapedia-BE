import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { BuyerGuard } from "src/common/guards/buyer.guard";

@Controller("cart")
@UseGuards(JwtAuthGuard, BuyerGuard)
export class CartController {
    constructor(private cartService : CartService) {}

    @Post(":productId")
    async addToCart(@Body() dto : AddToCartDto, @Param("productId") productId : string, @GetUser('id') userId : string) {
        const addToCartResult = await this.cartService.addToCart(dto, userId, productId)
        return {
            message : "add to cart successful",
            data : addToCartResult
        }
    }

    @Get()
    async getUserCart(@GetUser("id") userId : string) {
        const getUserCartResult = await this.cartService.getUserCart(userId)
        return {
            message : "get user cart success",
            data : getUserCartResult
        }
    }

    @Delete()
    async clearUserCart(@GetUser("id") userId : string) {
        await this.cartService.clearUserCart(userId)
        return {
            message : "clear user cart success",
            data : null
        }
    }
}