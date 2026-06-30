import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, RoleName } from '@prisma/client';

@Injectable()
export class AdminRepository {
  constructor(private prisma: PrismaService) {}

  countUsers() {
    return this.prisma.user.count();
  }

  countStores() {
    return this.prisma.store.count();
  }

  countProducts() {
    return this.prisma.product.count();
  }

  countOrders() {
    return this.prisma.order.count();
  }

  countUsersByRole(roleName: RoleName) {
    return this.prisma.user.count({
      where: { roles: { some: { roleName } } },
    });
  }

  groupOrdersByStatus() {
    return this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });
  }

  findRecentOrders(take: number) {
    return this.prisma.order.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, username: true } },
        store: { select: { id: true, storeName: true } },
      },
    });
  }

  findUsersPaginated(skip: number, take: number) {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        lastActiveRole: true,
        createdAt: true,
        roles: { select: { roleName: true } },
        store: { select: { storeName: true } },
        wallet: { select: { balance: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  findStoresPaginated(skip: number, take: number) {
    return this.prisma.store.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  findProductsPaginated(skip: number, take: number) {
    return this.prisma.product.findMany({
      include: {
        store: { select: { id: true, storeName: true } },
        _count: { select: { orderItems: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  findStoreById(id: string) {
    return this.prisma.store.findUnique({ where: { id } });
  }

  updateStore(id: string, data: Prisma.StoreUpdateInput) {
    return this.prisma.store.update({ where: { id }, data });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  findProductById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  findDriversPaginated(skip: number, take: number) {
    return this.prisma.user.findMany({
      where: { roles: { some: { roleName: 'DRIVER' } } },
      select: {
        id: true,
        username: true,
        email: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        wallet: { select: { balance: true } },
        _count: { select: { driverJobs: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  countDrivers() {
    return this.prisma.user.count({
      where: { roles: { some: { roleName: 'DRIVER' } } },
    });
  }

  transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number },
  ): Promise<T> {
    return this.prisma.$transaction(fn, options);
  }
}
