import { BadRequestException, Injectable } from "@nestjs/common";
import { CartRepository } from "./cart.repository";
import { ProductService } from "src/product/product.service";
import { Prisma } from "@prisma/client";
import { AddToCartDto } from "./dto/add-to-cart.dto";

@Injectable() 
export class CartService {
    constructor(
        private cartRepo : CartRepository,
        private productService : ProductService,
    ) {}

    async addToCart(dto : AddToCartDto, userId : string, productId : string) {
        const product = await this.productService.findProductOrThrow(productId)
        const cart = await this.cartRepo.findUserCartItems(userId)
        const productInCart = cart.find(p => p.productId == productId)
        const totalProductInCart = productInCart ? productInCart.quantity + dto.quantity : dto.quantity
        if (totalProductInCart > product.stock) throw new BadRequestException("Bad Request. Stock are not enough")
        if (cart.length > 0) {
            if (productInCart) {
                await this.cartRepo.addQuantityCart(productInCart.id, dto.quantity)
                return
            } else if(cart[0].product.storeId !== product.storeId) throw new BadRequestException("cart must be one store only")
        }
        return await this.cartRepo.addToCart(dto.quantity, productId, userId)
    }   

    async getUserCart(userId : string) {
        return await this.cartRepo.findUserCartItems(userId)
    }

    async clearUserCart(userId : string, tx? : Prisma.TransactionClient) {
        return this.cartRepo.deleteUserCart(userId, tx ?? null)
    }
}