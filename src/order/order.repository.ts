import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, Prisma, ShippingMethod } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';

/**
 * Repository untuk akses data pesanan di database.
 * Menangani operasi CRUD pesanan, item pesanan, log status, dan pekerjaan driver.
 * Menyediakan berbagai query untuk admin, penjual, pembeli, dan driver.
 */
export interface CreateOrderInput {
  buyerId: string;
  storeId: string;
  addressLabel: string;
  addressSnapshot: string;
  storeAddress: string;
  discountId?: string;
  shippingMethod: ShippingMethod;
  subtotal: number;
  discountValue: number;
  shippingFee: number;
  taxFee: number;
  totalPrice: number;
}

export interface CreateOrderItemsInput {
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

@Injectable()
export class OrderRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAllOrdersForAdmin(page = 1, limit = 10) {
    const where = {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: { id: true, username: true, email: true },
          },
          store: true,
          orderItems: {
            include: { product: true },
          },
          driverJob: {
            include: {
              driver: { select: { id: true, username: true } },
            },
          },
          statusLogs: {
            orderBy: { changedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getOverdueOrders(
    orderStatus: OrderStatus,
    tresholdDate: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getPrismaClient(tx).order.findMany({
      where: {
        status: orderStatus,
        createdAt: { lt: tresholdDate },
        overdueProcessedAt: null,
      },
      include: { orderItems: true },
    });
  }

  async findOverdueBySLA(
    statuses: OrderStatus[],
    slaMap: Record<string, Date>,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getPrismaClient(tx).order.findMany({
      where: {
        status: { in: statuses },
        overdueProcessedAt: null,
        OR: [
          { shippingMethod: 'INSTANT', createdAt: { lt: slaMap.INSTANT } },
          { shippingMethod: 'NEXT_DAY', createdAt: { lt: slaMap.NEXT_DAY } },
          { shippingMethod: 'REGULAR', createdAt: { lt: slaMap.REGULAR } },
        ],
      },
      include: {
        orderItems: true,
        buyer: { select: { id: true } },
        store: { select: { id: true, userId: true, storeName: true } },
      },
    });
  }

  async createOrder(order: CreateOrderInput, tx?: Prisma.TransactionClient) {
    return this.getPrismaClient(tx).order.create({
      data: {
        addressLabel: order.addressLabel,
        addressSnapshot: order.addressSnapshot,
        storeAddress: order.storeAddress,
        shippingFee: order.shippingFee,
        shippingMethod: order.shippingMethod,
        subtotal: order.subtotal,
        discountId: order.discountId,
        buyerId: order.buyerId,
        discountValue: order.discountValue,
        storeId: order.storeId,
        taxFee: order.taxFee,
        totalPrice: order.totalPrice,
      },
    });
  }

  async createOrderItems(
    orderItems: CreateOrderItemsInput[],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getPrismaClient(tx).orderItem.createMany({
      data: orderItems,
    });
  }

  async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatus,
    tx?: Prisma.TransactionClient,
    overdue?: Date,
  ) {
    return this.getPrismaClient(tx).order.update({
      where: {
        id: orderId,
      },
      data: {
        status: orderStatus,
        overdueProcessedAt: overdue,
      },
    });
  }

  async createDriverJob(
    driverJobData: { earning: number; takenAt: Date },
    driverId: string,
    orderId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getPrismaClient(tx).driverJob.create({
      data: {
        driverId,
        orderId,
        earning: driverJobData.earning,
        takenAt: driverJobData.takenAt,
      },
    });
  }

  async setDriverJobDone(orderId: string) {
    return this.prisma.driverJob.update({
      where: { orderId },
      data: { doneAt: new Date() },
    });
  }

  async findJobByOrderId(orderId: string) {
    return this.prisma.driverJob.findUnique({
      where: {
        orderId,
      },
    });
  }

  async findOrdersByUserId(userId: string) {
    return this.prisma.order.findMany({
      where: {
        buyerId: userId,
      },
      include: {
        store: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        driverJob: true,
        statusLogs: {
          orderBy: { changedAt: 'desc' },
        },
        reviews: {
          select: { productId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAvailableJobs() {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.READY_FOR_DELIVERY,
        driverJob: null,
      },
      include: {
        store: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrderStatusLog(
    orderId: string,
    status: OrderStatus,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getPrismaClient(tx).orderStatusLog.create({
      data: {
        orderId,
        status,
      },
    });
  }

  async findOrderById(orderId: string, tx?: Prisma.TransactionClient) {
    return this.getPrismaClient(tx).order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        driverJob: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        store: true,
        statusLogs: {
          orderBy: { changedAt: 'desc' },
        },
        reviews: {
          select: { productId: true },
        },
      },
    });
  }

  async findJobAvailable(orderId: string) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        status: OrderStatus.READY_FOR_DELIVERY,
        driverJob: null,
      },
    });
  }

  async findOrdersByDriverId(driverId: string) {
    return this.prisma.order.findMany({
      where: {
        driverJob: {
          driverId,
        },
      },
      include: {
        store: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        driverJob: true,
        statusLogs: {
          orderBy: { changedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrdersSeller(
    storeId: string,
    whereOptions: Prisma.OrderWhereInput,
    orderBy: 'asc' | 'desc',
  ) {
    return this.prisma.order.findMany({
      where: {
        storeId,
        ...whereOptions,
      },
      include: {
        buyer: {
          select: { id: true, username: true },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        driverJob: true,
        statusLogs: {
          orderBy: { changedAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: orderBy,
      },
    });
  }
}
