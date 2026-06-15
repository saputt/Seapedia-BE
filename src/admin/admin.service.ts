import { Injectable } from "@nestjs/common";
import { OrderStatus, WalletType } from "@prisma/client";
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