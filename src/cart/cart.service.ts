import { BadRequestException, Injectable } from "@nestjs/common";
import { CartRepository } from "./cart.repository";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { ProductService } from "src/product/product.service";

@Injectable() 
export class CartService {
    constructor(
        private cartRepo : CartRepository,
        private productService : ProductService
    ) {}

    async addToCart(dto : AddToCartDto, userId : string, productId : string) {
        const product = await this.productService.isProductExist(productId)
        const cart = await this.cartRepo.findUserCartItems(userId)
        if (cart.length > 0 && cart[0].product.storeId !== product.storeId) throw new BadRequestException("cart must be one store only")
        const cartData = await this.cartRepo.addToCart(dto, productId, userId)
        return {
            cartData
        }
    }   

    async getUserCart(userId : string) {
        const cart = await this.cartRepo.findUserCartItems(userId)
        return {
            cart
        }
    }

    async clearUserCart(userId : string) {
        return this.cartRepo.deleteUserCart(userId)
    }
}