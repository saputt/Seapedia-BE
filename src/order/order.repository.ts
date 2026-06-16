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

    async finAllOrdersForAdmin() {
        return this.prisma.order.findMany()
    }

    async getOverdueOrders(orderStatus : OrderStatus, tresholdDate : Date, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.order.findMany({
            where : {
                status : orderStatus,
                createdAt : {
                    lt : tresholdDate
                },
                overdueProcessedAt : null
            },
            include : {
                orderItems : true
            }
        })
    }

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

    async updateOrderStatus(orderId : string, orderStatus : OrderStatus, tx? : Prisma.TransactionClient, overdue? : Date) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.order.update({
            where : {
                id : orderId
            },
            data : {
                status : orderStatus,
                overdueProcessedAt : overdue
            }
        })
    }

    async createDriverJob(driverJobData : {earning : number, takenAt : Date}, driverId : string, orderId : string, tx? :Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.driverJob.create({
            data : { 
                driverId,
                orderId,
                earning : driverJobData.earning,
                takenAt : driverJobData.takenAt
            }
        })
    }

    async findJobByOrderId(orderId : string) {
        return this.prisma.driverJob.findUnique({
            where : {
                orderId
            }
        })
    }

    async findOrdersByUserId(userId : string) {
        return this.prisma.order.findMany({
            where : {
                buyerId : userId
            },
            include : {
                store : true,
                orderItems : {
                    include : {
                        product : true
                    }
                },
                driverJob : true,
                address : true,
                statusLogs : {
                    orderBy : { changedAt : "desc" }
                }
            },
            orderBy : { createdAt : "desc" }
        })
    }

    async findAvailableJobs() {
        return this.prisma.order.findMany({
            where : {
                status : OrderStatus.READY_FOR_DELIVERY,
                driverJob : null
            }
        })
    }

    async createOrderStatusLog(orderId : string, status : OrderStatus, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.orderStatusLog.create({
            data : {
                orderId,
                status
            }
        })
    }

    async findOrderById(orderId : string, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.order.findFirst({
            where : {
                id : orderId
            },
            include : {
                driverJob : true,
                orderItems : {
                    include : {
                        product : true
                    }
                },
                address : true,
                store : true                
            }
        })
    }

    async findJobAvailable(orderId : string) {
        return this.prisma.order.findFirst({
            where : {
                id : orderId,
                status : OrderStatus.READY_FOR_DELIVERY,
                driverJob : null
            }
        })
    }

    async getOrdersSeller(storeId : string, whereOptions : any, orderBy : any) {
        return this.prisma.order.findMany({
            where : {
                storeId,
                ...whereOptions
            },
            orderBy : {
                createdAt : orderBy
            }
        })
    }
}