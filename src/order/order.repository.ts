import { Injectable } from "@nestjs/common";
import { Order, OrderStatus, Prisma, ShippingMethod } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

export interface CreateOrderInput {
    buyerId: string;
    storeId: string;
    addressId: string;
    discountId?: string;
    shippingMethod: ShippingMethod;
    addressSnapshot: string;
    subtotal: number;
    discountValue: number;
    shippingFee: number;
    taxFee: number;
    totalPrice: number;
}

export interface CreateOrderItemsInput {
    orderId : string,
    productId : string,
    quantity : number,
    price : number
}

@Injectable()
export class OrderRepository {
    constructor(private prisma : PrismaService) {}

    async createOrder(order : CreateOrderInput, tx? : Prisma.TransactionClient, ) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.order.create({
            data : {
                addressSnapshot : order.addressSnapshot,
                shippingFee : order.shippingFee,
                shippingMethod : order.shippingMethod,
                subtotal : order.subtotal,
                discountId : order.discountId,
                addressId : order.addressId,
                buyerId : order.buyerId,
                discountValue : order.discountValue,
                storeId : order.storeId,
                taxFee : order.taxFee,
                totalPrice : order.totalPrice
            }
        })        
    }

    async createOrderItems(orderItems : CreateOrderItemsInput[], tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.orderItem.createMany({
            data : orderItems
        })
    }

    async updateOrderStatus(orderId : string, orderStatus : OrderStatus) {
        return this.prisma.order.update({
            where : {
                id : orderId
            },
            data : {
                status : orderStatus
            }
        })
    }

    async findOrderById(orderId : string) {
        return this.prisma.order.findFirst({
            where : {
                id : orderId
            },
            include : {
                driverJob : true
            }
        })
    }
}