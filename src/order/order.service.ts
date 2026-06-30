import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, RoleName } from '@prisma/client';
import { OrderCheckoutService } from './order-checkout.service';
import { OrderStatusService } from './order-status.service';
import { OrderQueryService } from './order-query.service';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { IOrderSummaryPayload } from './types/order.types';

/**
 * Service utama untuk mengelola pesanan (order).
 * Berfungsi sebagai facade yang mendelegasikan ke service yang lebih spesifik:
 * - OrderCheckoutService: Untuk checkout dan ringkasan order
 * - OrderStatusService: Untuk pembaruan status dan pembatalan
 * - OrderQueryService: Untuk query dan pencarian order
 *
 * Service ini mempertahankan backward compatibility dengan interface lama.
 */
@Injectable()
export class OrderService {
  constructor(
    private checkoutService: OrderCheckoutService,
    private statusService: OrderStatusService,
    private queryService: OrderQueryService,
  ) {}

  // ===== Checkout & Summary Methods =====

  async createOrderToken(orderPayload: IOrderSummaryPayload) {
    return this.checkoutService.createOrderToken(orderPayload);
  }

  async verifyOrderToken(orderToken: string) {
    return this.checkoutService.verifyOrderToken(orderToken);
  }

  async orderSummary(dto: OrderSummaryDto, userId: string) {
    return this.checkoutService.orderSummary(dto, userId);
  }

  async checkout(dto: CheckoutDto, userId: string) {
    return this.checkoutService.checkout(dto, userId);
  }

  // ===== Status & Cancellation Methods =====

  async findOrderOrThrow(orderId: string, tx?: Prisma.TransactionClient) {
    return this.statusService.findOrderOrThrow(orderId, tx);
  }

  async updateStatusOrder(
    storeId: string,
    orderId: string,
    userId: string,
    userRole: RoleName,
    tx?: Prisma.TransactionClient,
  ) {
    return this.statusService.updateStatusOrder(
      storeId,
      orderId,
      userId,
      userRole,
      tx,
    );
  }

  async cancelOrder(userId: string, orderId: string) {
    return this.statusService.cancelOrder(userId, orderId);
  }

  async createOrderStatusLog(
    orderId: string,
    orderStatus: OrderStatus,
    tx?: Prisma.TransactionClient,
  ) {
    return this.statusService.createOrderStatusLog(orderId, orderStatus, tx);
  }

  async isJobOrderAvailable(orderId: string) {
    return this.statusService.isJobOrderAvailable(orderId);
  }

  async takeJob(orderId: string, driverId: string, userRole: RoleName) {
    return this.statusService.takeJob(orderId, driverId, userRole);
  }

  async deliveryDone(orderId: string, driverId: string) {
    return this.statusService.deliveryDone(orderId, driverId);
  }

  async cancelOrderOverdue(
    orderId: string,
    tx?: Prisma.TransactionClient,
    overdue?: Date,
  ) {
    return this.statusService.cancelOrderOverdue(orderId, tx, overdue);
  }

  // ===== Query Methods =====

  async getOrderById(orderId: string, userId: string) {
    return this.queryService.getOrderById(orderId, userId);
  }

  async getAllOrders(userId: string) {
    return this.queryService.getAllOrders(userId);
  }

  async getAllOrdersForAdmin(page = 1, limit = 10, status?: string) {
    return this.queryService.getAllOrdersForAdmin(page, limit, status);
  }

  async getOverdueOrders(
    orderStatus: OrderStatus,
    thresholdDate: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return this.queryService.getOverdueOrders(orderStatus, thresholdDate, tx);
  }

  async getAvailableJobs() {
    return this.queryService.getAvailableJobs();
  }

  async getMyJobs(driverId: string) {
    return this.queryService.getMyJobs(driverId);
  }

  async getOrdersForSeller(userId: string, filter: FilterOrderDto) {
    return this.queryService.getOrdersForSeller(userId, filter);
  }
}
