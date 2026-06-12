import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";

@Injectable()
export class CartRepository {
    constructor(private prisma : PrismaService) {}

    async findUserCartItems(userId : string) {
        return this.prisma.cartItem.findMany({
            where : {
                userId
            },
            include : {
                product : true
            }
        })
    }

    async addToCart(dto : AddToCartDto, productId : string, userId : string) {
        return this.prisma.cartItem.create({
            data : {
                quantity : dto.quantity,
                productId,
                userId
            }
        })
    }

    async deleteUserCart(userId : string) {
        return this.prisma.cartItem.deleteMany({
            where : {
                userId
            }
        })
    }
}