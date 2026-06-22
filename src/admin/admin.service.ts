import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, WalletType } from '@prisma/client';
import { OrderService } from 'src/order/order.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductService } from 'src/product/product.service';
import { WalletService } from 'src/wallet/wallet.service';
import { OrderRepository } from 'src/order/order.repository';

/**
 * Service untuk fitur admin.
 * Menyediakan dashboard admin (statistik pengguna, toko, produk, pesanan),
 * manajemen pengguna (daftar pengguna dengan pagination),
 * dan simulasi keterlambatan pesanan berdasarkan SLA (Service Level Agreement).
 * Simulasi akan membatalkan pesanan yang melebihi batas waktu pengiriman
 * dan mengembalikan saldo pembeli serta stok produk secara otomatis.
 */
const SLA_DAYS: Record<string, number> = {
  INSTANT: 1,
  NEXT_DAY: 2,
  REGULAR: 3,
};

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminService {
  private simulatedTimeOffsetMs = 0;

  constructor(
    private prisma: PrismaService,
    private orderService: OrderService,
    private walletService: WalletService,
    private productService: ProductService,
    private orderRepo: OrderRepository,
  ) {}

  getSimulatedDate() {
    return new Date(Date.now() + this.simulatedTimeOffsetMs);
  }

  async getDashboard() {
    const [totalUsers, totalStores, totalProducts, totalOrders] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.store.count(),
        this.prisma.product.count(),
        this.prisma.order.count(),
      ]);

    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    const recentOrders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, username: true } },
        store: { select: { id: true, storeName: true } },
      },
    });

    return {
      stats: {
        totalUsers,
        totalStores,
        totalProducts,
        totalOrders,
      },
      ordersByStatus: ordersByStatus.reduce(
        (acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentOrders,
    };
  }

  async getUsers(page = 1, limit = 20) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          lastActiveRole: true,
          createdAt: true,
          roles: {
            select: { roleName: true },
          },
          store: {
            select: { storeName: true },
          },
          wallet: {
            select: { balance: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getStores(page = 1, limit = 20) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        include: {
          user: { select: { id: true, username: true, email: true } },
          _count: { select: { products: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.store.count(),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getProducts(page = 1, limit = 20) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        include: {
          store: { select: { id: true, storeName: true } },
          _count: { select: { orderItems: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count(),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleStoreActive(id: string, reason?: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException(`Store with id ${id} not found`);
    const nowActive = !store.isActive;
    return this.prisma.store.update({
      where: { id },
      data: {
        isActive: nowActive,
        deactivationReason: nowActive ? null : (reason || null),
      },
    });
  }

  async toggleProductHidden(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with id ${id} not found`);
    return this.prisma.product.update({
      where: { id },
      data: { isHidden: !product.isHidden },
    });
  }

  async simulateOverdue(daysToSkip = 1) {
    this.simulatedTimeOffsetMs += daysToSkip * DAY_MS;
    const simulatedNow = this.getSimulatedDate();

    const slaMap: Record<string, Date> = {};
    for (const [method, days] of Object.entries(SLA_DAYS)) {
      const d = new Date(simulatedNow);
      d.setDate(d.getDate() - days);
      slaMap[method] = d;
    }

    const logs: string[] = [];
    let totalRefund = 0;
    const countByMethod: Record<string, number> = {
      INSTANT: 0,
      NEXT_DAY: 0,
      REGULAR: 0,
    };

    await this.prisma.$transaction(
      async (tx) => {
        const overdueOrders = await this.orderRepo.findOverdueBySLA(
          [OrderStatus.PENDING, OrderStatus.READY_FOR_DELIVERY],
          slaMap,
          tx,
        );

        for (const order of overdueOrders) {
          if (order.status === OrderStatus.CANCELLED) continue;

          await this.walletService.verifyAndRollbackBalance(
            tx,
            order.buyerId,
            order.totalPrice,
            WalletType.REFUND,
          );

          for (const item of order.orderItems) {
            await this.productService.verifyAndRollbackStock(
              tx,
              item.productId,
              item.quantity,
            );
          }

          await this.orderService.cancelOrderOverdue(order.id, tx, new Date());
          await this.orderService.createOrderStatusLog(
            order.id,
            OrderStatus.CANCELLED,
            tx,
          );

          totalRefund += order.totalPrice;
          countByMethod[order.shippingMethod] =
            (countByMethod[order.shippingMethod] || 0) + 1;

          const methodLabel = {
            INSTANT: 'Instan',
            NEXT_DAY: 'Besok',
            REGULAR: 'Reguler',
          };
          logs.push(
            `Pesanan #${order.id.slice(0, 8)} — ${methodLabel[order.shippingMethod] || order.shippingMethod} — ` +
              `Toko: ${order.store?.storeName || '-'} — Total: Rp${order.totalPrice.toLocaleString('id-ID')}`,
          );
        }
      },
      { maxWait: 15000, timeout: 60000 },
    );

    return {
      simulatedDate: simulatedNow.toISOString(),
      daysSkipped: daysToSkip,
      totalDaysSkipped: Math.round(this.simulatedTimeOffsetMs / DAY_MS),
      slaApplied: {
        INSTANT: `${SLA_DAYS.INSTANT} hari`,
        NEXT_DAY: `${SLA_DAYS.NEXT_DAY} hari`,
        REGULAR: `${SLA_DAYS.REGULAR} hari`,
      },
      summary: {
        totalProcessed: logs.length,
        totalRefund,
        byMethod: countByMethod,
      },
      logs,
    };
  }

  resetSimulation() {
    this.simulatedTimeOffsetMs = 0;
    return { message: 'simulation reset success' };
  }
}
