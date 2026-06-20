import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";

/**
 * Repository untuk akses data keranjang belanja di database.
 * Menangani operasi CRUD item keranjang, termasuk penambahan quantity,
 * penghapusan item, dan pengosongan seluruh keranjang pengguna.
 */
@Injectable()
export class CartRepository {
    constructor(private prisma : PrismaService) {}

    async addQuantityCart(cartId : string, quantityProduct : number) {
        return this.prisma.cartItem.update({
            where : {
                id : cartId
            },
            data : {
                quantity : {
                    increment : quantityProduct
                }
            }
        })
    }

    async findUserCartItems(userId : string) {
        return this.prisma.cartItem.findMany({
            where : {
                userId
            },
            include : {
                product : true,
            },
        })
    }

    async addToCart(quantity : number, productId : string, userId : string) {
        return this.prisma.cartItem.create({
            data : {
                quantity,
                productId,
                userId
            }
        })
    }

    async deleteUserCart(userId : string, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.cartItem.deleteMany({
            where : {
                userId
            }
        })
    }

    async deleteCartItem(cartItemId : string) {
        return this.prisma.cartItem.delete({
            where : {
                id : cartItemId
            }
        })
    }

    async updateCartItemQuantity(cartItemId : string, quantity : number) {
        return this.prisma.cartItem.update({
            where : {
                id : cartItemId
            },
            data : {
                quantity
            }
        })
    }
}