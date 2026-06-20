import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { OrderStatus, Prisma } from '@prisma/client';
import { FilterOrderDto } from './dto/filter-order.dto';
import { StoreService } from 'src/store/store.service';
import { findOrThrow, checkOwnership } from 'src/common/helpers/prisma.helper';

/**
 * Service untuk menangani query dan pencarian order.
 * Bertanggung jawab untuk:
 * - Pencarian order berdasarkan ID
 * - Daftar order untuk buyer, seller, dan admin
 * - Daftar pekerjaan pengiriman untuk driver
 * - Filter order berdasarkan status
 */
@Injectable()
export class OrderQueryService {
  constructor(
    private orderRepo: OrderRepository,
    private storeService: StoreService,
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
   * Mendapatkan detail order berdasarkan ID dengan validasi kepemilikan.
   */
  async getOrderById(orderId: string, userId: string) {
    const order = await this.findOrderOrThrow(orderId);
    checkOwnership(order.buyerId, userId, 'order');
    return order;
  }

  /**
   * Mendapatkan semua order untuk buyer tertentu.
   */
  async getAllOrders(userId: string) {
    return this.orderRepo.findOrdersByUserId(userId);
  }

  /**
   * Mendapatkan semua order untuk admin dengan pagination.
   */
  async getAllOrdersForAdmin(page = 1, limit = 10) {
    return this.orderRepo.findAllOrdersForAdmin(page, limit);
  }

  /**
   * Mendapatkan order yang melebihi batas waktu (overdue).
   */
  async getOverdueOrders(
    orderStatus: OrderStatus,
    tresholdDate: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return this.orderRepo.getOverdueOrders(orderStatus, tresholdDate, tx);
  }

  /**
   * Mendapatkan pekerjaan pengiriman yang tersedia untuk driver.
   */
  async getAvailableJobs() {
    return this.orderRepo.findAvailableJobs();
  }

  /**
   * Mendapatkan pekerjaan pengiriman untuk driver tertentu.
   */
  async getMyJobs(driverId: string) {
    return this.orderRepo.findOrdersByDriverId(driverId);
  }

  /**
   * Mendapatkan daftar order untuk seller tertentu dengan filter.
   */
  async getOrdersForSeller(userId: string, filter: FilterOrderDto) {
    const { orderBy, status } = filter;

    const store = await this.storeService.findUserStore(userId);

    const whereOptions: Prisma.OrderWhereInput = {};

    if (status) {
      whereOptions.status = status;
    }

    return this.orderRepo.getOrdersSeller(store.id, whereOptions, orderBy);
  }
}
