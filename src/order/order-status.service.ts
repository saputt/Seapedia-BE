import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { StoreService } from 'src/store/store.service';
import { OrderStatus, Prisma, RoleName, WalletType } from '@prisma/client';
import { WalletService } from 'src/wallet/wallet.service';
import { ProductService } from 'src/product/product.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { findOrThrow, checkOwnership } from 'src/common/helpers/prisma.helper';

/**
 * Service untuk menangani pembaruan status order dan pembatalan.
 * Bertanggung jawab untuk:
 * - Pembaruan status pesanan (PENDING → READY_FOR_DELIVERY → ON_DELIVERY → DELIVERED)
 * - Pembatalan pesanan dan pengembalian dana
 * - Manajemen pekerjaan driver
 * - Pembatalan otomatis untuk pesanan overdue
 */
@Injectable()
export class OrderStatusService {
  constructor(
    private orderRepo: OrderRepository,
    private storeService: StoreService,
    private walletService: WalletService,
    private productService: ProductService,
    private prisma: PrismaService,
  ) {}

  /**
   * Mencari order berdasarkan ID atau throw exception.
   */
  async findOrderOrThrow(orderId: string, tx?: Prisma.TransactionClient) {
    return findOrThrow(
      () => this.orderRepo.findOrderById(orderId, tx),
      'order',
      orderId,
    );
  }

  /**
   * Memperbarui status order berdasarkan peran pengguna.
   * PENDING → READY_FOR_DELIVERY (Seller)
   * READY_FOR_DELIVERY → ON_DELIVERY (Driver)
   * ON_DELIVERY → DELIVERED (Buyer)
   */
  async updateStatusOrder(
    storeId: string,
    orderId: string,
    userId: string,
    userRole: RoleName,
    tx?: Prisma.TransactionClient,
  ) {
    const store = await this.storeService.findStoreOrThrow(storeId, tx);
    const order = await this.findOrderOrThrow(orderId, tx);

    const execute = async (tx: Prisma.TransactionClient) => {
      let statusUpdate: OrderStatus;
      if (order.status === OrderStatus.PENDING) {
        if (userRole !== RoleName.SELLER)
          throw new ForbiddenException('You cannot update status this order');
        checkOwnership(store.userId, userId, 'order');
        if (storeId !== order.storeId)
          throw new ForbiddenException('You cannot update status this order');
        statusUpdate = OrderStatus.READY_FOR_DELIVERY;
      } else if (order.status === OrderStatus.READY_FOR_DELIVERY) {
        if (userRole !== RoleName.DRIVER)
          throw new ForbiddenException(
            'Forbidden Access. You cannot update this store. Driver only',
          );
        if (!order.driverJob)
          throw new BadRequestException('Bad request. Driver still empty');
        checkOwnership(order.driverJob.driverId, userId, 'driver job');
        statusUpdate = OrderStatus.ON_DELIVERY;
      } else if (order.status === OrderStatus.ON_DELIVERY) {
        if (userRole !== RoleName.BUYER)
          throw new ForbiddenException(
            'Forbidden Access. You cannot update this store. Buyer only',
          );
        checkOwnership(order.buyerId, userId, 'order');
        statusUpdate = OrderStatus.DELIVERED;

        const driverEarning = order.shippingFee;
        await this.walletService.increaseBalance(
          driverEarning,
          order.driverJob.driverId,
          WalletType.DRIVER_EARNING,
          tx,
        );

        const sellerEarning = order.subtotal - order.discountValue;
        await this.walletService.increaseBalance(
          sellerEarning,
          store.userId,
          WalletType.SELLER_EARNING,
          tx,
        );
      } else {
        throw new BadRequestException('You cannot update status order anymore');
      }
      await this.orderRepo.createOrderStatusLog(order.id, statusUpdate, tx);
      return this.orderRepo.updateOrderStatus(orderId, statusUpdate, tx);
    };

    if (tx) return execute(tx);

    return await this.prisma.$transaction(execute);
  }

  /**
   * Membatalkan pesanan dan mengembalikan dana serta stok.
   * Hanya pesanan dengan status PENDING yang bisa dibatalkan.
   */
  async cancelOrder(userId: string, orderId: string) {
    const order = await this.findOrderOrThrow(orderId);
    checkOwnership(order.buyerId, userId, 'order');
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException(
        'Bad Request. You cannot cancel this order anymore',
      );

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        await this.productService.verifyAndRollbackStock(
          tx,
          item.productId,
          item.quantity,
        );
      }

      const totalMoneyBack = order.totalPrice;
      await this.walletService.verifyAndRollbackBalance(
        tx,
        userId,
        totalMoneyBack,
        WalletType.REFUND,
      );

      const orderUpdated = await this.orderRepo.updateOrderStatus(
        orderId,
        OrderStatus.CANCELLED,
        tx,
      );

      await this.orderRepo.createOrderStatusLog(
        orderId,
        OrderStatus.CANCELLED,
        tx,
      );

      return orderUpdated;
    });
  }

  /**
   * Membuat log perubahan status order.
   */
  async createOrderStatusLog(
    orderId: string,
    orderStatus: OrderStatus,
    tx?: Prisma.TransactionClient,
  ) {
    return this.orderRepo.createOrderStatusLog(orderId, orderStatus, tx);
  }

  /**
   * Mengecek apakah pekerjaan pengiriman tersedia.
   */
  async isJobOrderAvailable(orderId: string) {
    const jobOrder = await this.orderRepo.findJobAvailable(orderId);
    if (!jobOrder) throw new BadRequestException('Job is cannot be take');
    return jobOrder;
  }

  /**
   * Mengambil pekerjaan pengiriman oleh driver.
   */
  async takeJob(orderId: string, driverId: string, userRole: RoleName) {
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
      select: { isSuspended: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.isSuspended)
      throw new ForbiddenException(
        'Your account is suspended. You cannot take jobs.',
      );

    const order = await this.isJobOrderAvailable(orderId);
    const jobData = {
      earning: order.shippingFee,
      takenAt: new Date(),
    };
    return await this.prisma.$transaction(async (tx) => {
      const job = await this.orderRepo.createDriverJob(
        jobData,
        driverId,
        orderId,
        tx,
      );
      await this.updateStatusOrder(
        order.storeId,
        orderId,
        driverId,
        userRole,
        tx,
      );
      return job;
    });
  }

  /**
   * Menandai pengiriman sebagai selesai oleh driver.
   */
  async deliveryDone(orderId: string, driverId: string) {
    const order = await this.findOrderOrThrow(orderId);
    if (order.status !== OrderStatus.ON_DELIVERY)
      throw new BadRequestException('Order is not in delivery');
    if (!order.driverJob)
      throw new ForbiddenException('You are not the driver for this order');
    checkOwnership(order.driverJob.driverId, driverId, 'driver job');
    return this.orderRepo.setDriverJobDone(orderId);
  }

  /**
   * Membatalkan pesanan yang melebihi batas waktu (overdue).
   */
  async cancelOrderOverdue(
    orderId: string,
    tx?: Prisma.TransactionClient,
    overdue?: Date,
  ) {
    return this.orderRepo.updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      tx,
      overdue,
    );
  }
}
