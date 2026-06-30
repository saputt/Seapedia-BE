import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * Repository untuk akses data produk di database.
 * Menangani operasi CRUD produk, pengurangan stok atomik,
 * dan query produk dengan filter serta pagination.
 */
@Injectable()
export class ProductRepository {
  constructor(private prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto, storeId: string) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        stock: dto.stock,
        description: dto.description,
        imageUrl: dto.imageUrl,
        category: dto.category,
        storeId,
      },
    });
  }

  async reduceStockAtomically(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
  ) {
    return tx.product.updateMany({
      where: {
        id: productId,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
      },
    });
  }

  async increaseStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
  ) {
    return tx.product.updateMany({
      where: { id: productId },
      data: {
        stock: { increment: quantity },
      },
    });
  }

  async findAllProducts(
    whereConditions: Prisma.ProductWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' },
  ) {
    return this.prisma.product.findMany({
      where: whereConditions,
      skip,
      take,
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            imageUrl: true,
            address: true,
            products: { select: { id: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
      orderBy,
    });
  }

  async countProducts(whereConditions: Prisma.ProductWhereInput) {
    return this.prisma.product.count({
      where: whereConditions,
    });
  }

  async findProductsByIds(ids: string[]) {
    return this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            imageUrl: true,
            address: true,
            products: { select: { id: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    });
  }

  async findTopSellingProductIds(
    whereConditions: Prisma.ProductWhereInput,
    take: number,
  ) {
    const productIds = await this.prisma.product.findMany({
      where: whereConditions,
      select: { id: true },
    });
    const ids = productIds.map((p) => p.id);

    const sold = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { in: ids },
        order: { status: OrderStatus.DELIVERED },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
    });

    const soldSet = new Set(sold.map((s) => s.productId));
    const unsold = ids.filter((id) => !soldSet.has(id));

    return [...sold.map((s) => s.productId), ...unsold].slice(0, take);
  }

  async findProductById(productId: string) {
    return this.prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            imageUrl: true,
            address: true,
            products: { select: { id: true } },
            _count: { select: { products: true } },
          },
        },
      },
    });
  }

  async deleteProductById(productId: string) {
    return this.prisma.product.delete({
      where: {
        id: productId,
      },
    });
  }

  async updateProductById(dto: UpdateProductDto, productId: string) {
    return this.prisma.product.update({
      where: {
        id: productId,
      },
      data: dto,
    });
  }
}
