import { Injectable } from "@nestjs/common";
import { OrderStatus, WalletType, RoleName } from "@prisma/client";
import { OrderService } from "src/order/order.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ProductService } from "src/product/product.service";
import { WalletService } from "src/wallet/wallet.service";

@Injectable()
export class AdminService {
    constructor(
        private prisma : PrismaService,
        private orderService : OrderService,
        private walletService : WalletService,
        private productService : ProductService
    ) {}

    async getDashboard() {
        const [totalUsers, totalStores, totalProducts, totalOrders, walletSum] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.store.count(),
            this.prisma.product.count(),
            this.prisma.order.count(),
            this.prisma.wallet.aggregate({ _sum : { balance : true } })
        ])

        const ordersByStatus = await this.prisma.order.groupBy({
            by : ["status"],
            _count : true
        })

        const revenue = await this.prisma.walletTransaction.aggregate({
            _sum : { amount : true },
            where : {
                type : { in : [WalletType.PAYMENT] }
            }
        })

        const recentOrders = await this.prisma.order.findMany({
            take : 10,
            orderBy : { createdAt : "desc" },
            include : {
                buyer : { select : { id : true, username : true } },
                store : { select : { id : true, storeName : true } }
            }
        })

        const topSellers = await this.prisma.walletTransaction.groupBy({
            by : ["walletId"],
            where : { type : WalletType.SELLER_EARNING },
            _sum : { amount : true },
            orderBy : { _sum : { amount : "desc" } },
            take : 5
        })

        const topSellerDetails = await Promise.all(
            topSellers.map(async (s) => {
                const wallet = await this.prisma.wallet.findUnique({
                    where : { id : s.walletId },
                    include : {
                        user : {
                            select : { id : true, username : true, store : { select : { storeName : true } } }
                        }
                    }
                })
                return {
                    username : wallet?.user?.username ?? "Unknown",
                    storeName : wallet?.user?.store?.storeName ?? "-",
                    totalEarnings : s._sum.amount ?? 0
                }
            })
        )

        return {
            stats : {
                totalUsers,
                totalStores,
                totalProducts,
                totalOrders,
                totalRevenue : revenue._sum.amount ?? 0,
                totalWalletBalance : walletSum._sum.balance ?? 0
            },
            ordersByStatus : ordersByStatus.reduce((acc, curr) => {
                acc[curr.status] = curr._count
                return acc
            }, {} as Record<string, number>),
            recentOrders,
            topSellers : topSellerDetails
        }
    }

    async getUsers(page = 1, limit = 20) {
        const [data, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                select : {
                    id : true,
                    username : true,
                    email : true,
                    lastActiveRole : true,
                    createdAt : true,
                    roles : {
                        select : { roleName : true }
                    },
                    store : {
                        select : { storeName : true }
                    },
                    wallet : {
                        select : { balance : true }
                    }
                },
                orderBy : { createdAt : "desc" },
                skip : (page - 1) * limit,
                take : limit
            }),
            this.prisma.user.count()
        ])
        return { data, total, page, totalPages : Math.ceil(total / limit) }
    }

    async simulateOverdue(dayToSkip : number) {
        const tresholdDate = new Date()
        tresholdDate.setDate(tresholdDate.getDate() - dayToSkip)

        return await this.prisma.$transaction(async (tx) => {
            const overdueOrders = await this.orderService.getOverdueOrders(OrderStatus.PENDING, tresholdDate, tx)

            for (const order of overdueOrders) {
                const currentOrder = await this.orderService.findOrderOrThrow(order.id, tx)

                if (currentOrder.status === OrderStatus.CANCELLED) continue

                await this.walletService.verifyAndRollbackBalance(tx, order.buyerId, order.totalPrice, WalletType.REFUND)

                for (const item of order.orderItems) {
                    await this.productService.verifyAndRollbackStock(tx, item.productId, item.quantity)
                }

                await this.orderService.cancelOrderOverdue(order.id, tx, new Date())

                await this.orderService.createOrderStatusLog(order.id, OrderStatus.CANCELLED, tx)
            }

            const overdueDeliveryOrders = await this.orderService.getOverdueOrders(OrderStatus.READY_FOR_DELIVERY, tresholdDate, tx)

            for (const order of overdueDeliveryOrders) {
                const currentOrder = await this.orderService.findOrderOrThrow(order.id, tx)

                if (currentOrder.status === OrderStatus.CANCELLED) continue

                await this.walletService.verifyAndRollbackBalance(tx, order.buyerId, order.totalPrice, WalletType.REFUND)

                for (const item of order.orderItems) {
                    await this.productService.verifyAndRollbackStock(tx, item.productId, item.quantity)
                }

                await this.orderService.cancelOrderOverdue(order.id, tx, new Date())

                await this.orderService.createOrderStatusLog(order.id, OrderStatus.CANCELLED, tx)
            }
        })
    }
}
