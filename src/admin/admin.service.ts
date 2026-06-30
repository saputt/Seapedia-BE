import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, RoleName, WalletType } from '@prisma/client';
import { OrderService } from 'src/order/order.service';
import { ProductService } from 'src/product/product.service';
import { WalletService } from 'src/wallet/wallet.service';
import { OrderRepository } from 'src/order/order.repository';
import { AdminRepository } from './admin.repository';

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
    private adminRepo: AdminRepository,
    private orderService: OrderService,
    private walletService: WalletService,
    private productService: ProductService,
    private orderRepo: OrderRepository,
  ) {}

  getSimulatedDate() {
    return new Date(Date.now() + this.simulatedTimeOffsetMs);
  }

  async getDashboard() {
    const [totalUsers, totalStores, totalProducts, totalOrders, totalDrivers] =
      await Promise.all([
        this.adminRepo.countUsers(),
        this.adminRepo.countStores(),
        this.adminRepo.countProducts(),
        this.adminRepo.countOrders(),
        this.adminRepo.countUsersByRole(RoleName.DRIVER),
      ]);

    const ordersByStatus = await this.adminRepo.groupOrdersByStatus();

    const recentOrders = await this.adminRepo.findRecentOrders(10);

    return {
      stats: {
        totalUsers,
        totalStores,
        totalProducts,
        totalOrders,
        totalDrivers,
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
    const data = await this.adminRepo.findUsersPaginated(
      (page - 1) * limit,
      limit,
    );
    const total = await this.adminRepo.countUsers();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getStores(page = 1, limit = 20) {
    const data = await this.adminRepo.findStoresPaginated(
      (page - 1) * limit,
      limit,
    );
    const total = await this.adminRepo.countStores();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getProducts(page = 1, limit = 20) {
    const data = await this.adminRepo.findProductsPaginated(
      (page - 1) * limit,
      limit,
    );
    const total = await this.adminRepo.countProducts();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleStoreActive(id: string, reason?: string) {
    const store = await this.adminRepo.findStoreById(id);
    if (!store) throw new NotFoundException(`Store with id ${id} not found`);
    const nowActive = !store.isActive;
    return this.adminRepo.updateStore(id, {
      isActive: nowActive,
      deactivationReason: nowActive ? null : reason || null,
    });
  }

  async getDrivers(page = 1, limit = 20) {
    const data = await this.adminRepo.findDriversPaginated(
      (page - 1) * limit,
      limit,
    );
    const total = await this.adminRepo.countDrivers();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleDriverSuspend(id: string, reason?: string) {
    const user = await this.adminRepo.findUserById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    const nowSuspended = !user.isSuspended;
    return this.adminRepo.updateUser(id, {
      isSuspended: nowSuspended,
      suspensionReason: nowSuspended ? reason || null : null,
    });
  }

  async toggleProductHidden(id: string) {
    const product = await this.adminRepo.findProductById(id);
    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);
    return this.adminRepo.updateProduct(id, {
      isHidden: !product.isHidden,
    });
  }

  private buildSlaMap(fromDate: Date): Record<string, Date> {
    const slaMap: Record<string, Date> = {};
    for (const [method, days] of Object.entries(SLA_DAYS)) {
      const d = new Date(fromDate);
      d.setDate(d.getDate() - days);
      slaMap[method] = d;
    }
    return slaMap;
  }

  async processOverdueOrders() {
    const now = new Date();
    const slaMap = this.buildSlaMap(now);
    return this.processOverdueBySlaMap(slaMap);
  }

  private async processOverdueBySlaMap(slaMap: Record<string, Date>) {
    const logs: string[] = [];
    let totalRefund = 0;
    const countByMethod: Record<string, number> = {
      INSTANT: 0,
      NEXT_DAY: 0,
      REGULAR: 0,
    };

    await this.adminRepo.transaction(
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

        const methodLabel: Record<string, string> = {
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
      totalProcessed: logs.length,
      totalRefund,
      byMethod: countByMethod,
      logs,
    };
  }

  async simulateOverdue(daysToSkip = 1) {
    this.simulatedTimeOffsetMs += daysToSkip * DAY_MS;
    const simulatedNow = this.getSimulatedDate();
    const slaMap = this.buildSlaMap(simulatedNow);
    const result = await this.processOverdueBySlaMap(slaMap);

    return {
      simulatedDate: simulatedNow.toISOString(),
      daysSkipped: daysToSkip,
      totalDaysSkipped: Math.round(this.simulatedTimeOffsetMs / DAY_MS),
      slaApplied: {
        INSTANT: `${SLA_DAYS.INSTANT} hari`,
        NEXT_DAY: `${SLA_DAYS.NEXT_DAY} hari`,
        REGULAR: `${SLA_DAYS.REGULAR} hari`,
      },
      summary: result,
      logs: result.logs,
    };
  }

  resetSimulation() {
    this.simulatedTimeOffsetMs = 0;
    return { message: 'simulation reset success' };
  }
}
