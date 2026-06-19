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

    async finAllOrdersForAdmin(page = 1, limit = 10) {
        const where = {}
        const [data, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include : {
                    buyer : {
                        select : { id : true, username : true, email : true }
                    },
                    store : true,
                    orderItems : {
                        include : { product : true }
                    },
                    address : true,
                    driverJob : {
                        include : {
                            driver : { select : { id : true, username : true } }
                        }
                    },
                    statusLogs : {
                        orderBy : { changedAt : "desc" }
                    }
                },
                orderBy : { createdAt : "desc" },
                skip : (page - 1) * limit,
                take : limit
            }),
            this.prisma.order.count({ where })
        ])
        return { data, total, page, totalPages : Math.ceil(total / limit) }
    }

    async getOverdueOrders(orderStatus : OrderStatus, tresholdDate : Date, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.order.findMany({
            where : {
                status : orderStatus,
                createdAt : { lt : tresholdDate },
                overdueProcessedAt : null
            },
            include : { orderItems : true }
        })
    }

    async findOverdueBySLA(statuses : OrderStatus[], slaMap : Record<string, Date>, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.order.findMany({
            where : {
                status : { in : statuses },
                overdueProcessedAt : null,
                OR : [
                    { shippingMethod : "INSTANT", createdAt : { lt : slaMap.INSTANT } },
                    { shippingMethod : "NEXT_DAY", createdAt : { lt : slaMap.NEXT_DAY } },
                    { shippingMethod : "REGULAR", createdAt : { lt : slaMap.REGULAR } },
                ]
            },
            include : {
                orderItems : true,
                buyer : { select : { id : true } },
                store : { select : { id : true, userId : true, storeName : true } }
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

    async setDriverJobDone(orderId : string) {
        return this.prisma.driverJob.update({
            where : { orderId },
            data : { doneAt : new Date() }
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
            },
            include : {
                store : true,
                orderItems : {
                    include : {
                        product : true
                    }
                },
                address : true,
                buyer : {
                    select : { id : true, username : true }
                }
            },
            orderBy : { createdAt : "desc" }
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
                store : true,
                statusLogs : {
                    orderBy : { changedAt : "desc" }
                }
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

    async findOrdersByDriverId(driverId : string) {
        return this.prisma.order.findMany({
            where : {
                driverJob : {
                    driverId
                }
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

    async getOrdersSeller(storeId : string, whereOptions : any, orderBy : any) {
        return this.prisma.order.findMany({
            where : {
                storeId,
                ...whereOptions
            },
            include : {
                buyer : {
                    select : { id : true, username : true }
                },
                orderItems : {
                    include : {
                        product : true
                    }
                },
                address : true,
                driverJob : true,
                statusLogs : {
                    orderBy : { changedAt : "desc" }
                }
            },
            orderBy : {
                createdAt : orderBy
            }
        })
    }
}