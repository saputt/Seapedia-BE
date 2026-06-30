import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StoreService } from 'src/store/store.service';
import { Prisma, OrderStatus } from '@prisma/client';
import { GetProductFilterDto } from './dto/get-product-filter.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { findOrThrow, checkOwnership } from 'src/common/helpers/prisma.helper';
import { extractStoragePath } from 'src/common/helpers/storage.helper';
import { ProductBasic, ProductWithStats } from './types/product.types';
import { StorageService } from 'src/storage/storage.service';

/**
 * Service untuk mengelola produk.
 * Menyediakan CRUD produk, validasi stok (pengurangan dan pengembalian),
 * serta pencarian dengan filter (harga, kategori, pencarian, sorting).
 * Setiap produk dilengkapi dengan statistik review (rating rata-rata, jumlah review)
 * dan jumlah terjual.
 */
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private productRepo: ProductRepository,
    private storeService: StoreService,
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async verifyAndReduceStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
  ) {
    const result = await this.productRepo.reduceStockAtomically(
      tx,
      productId,
      quantity,
    );
    if (result.count === 0)
      throw new BadRequestException(`Product is out of stock`);
  }

  async verifyAndRollbackStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
  ) {
    const result = await this.productRepo.increaseStock(
      tx,
      productId,
      quantity,
    );
    if (result.count === 0)
      throw new BadRequestException(`Product is not exist`);
  }

  async findProductOrThrow(productId: string) {
    return findOrThrow(
      () => this.productRepo.findProductById(productId),
      'product',
      productId,
    );
  }

  private async attachReviewStats(
    products: ProductBasic[],
  ): Promise<ProductWithStats[]> {
    if (products.length === 0) return products as ProductWithStats[];
    const ids = products.map((p) => p.id);
    const [reviewStats, soldStats] = await Promise.all([
      this.prisma.productReview.groupBy({
        by: ['productId'],
        where: { productId: { in: ids } },
        _count: { id: true },
        _avg: { rating: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: ids },
          order: { status: OrderStatus.DELIVERED },
        },
        _sum: { quantity: true },
      }),
    ]);
    const reviewMap = new Map(
      reviewStats.map((s) => [
        s.productId,
        {
          reviewCount: s._count.id,
          averageRating: Number(s._avg.rating?.toFixed(1)) || 0,
        },
      ]),
    );
    const soldMap = new Map(
      soldStats.map((s) => [s.productId, s._sum.quantity ?? 0]),
    );
    return products.map((p) => ({
      ...p,
      reviewCount: reviewMap.get(p.id)?.reviewCount ?? 0,
      averageRating: reviewMap.get(p.id)?.averageRating ?? 0,
      soldCount: soldMap.get(p.id) ?? 0,
    }));
  }

  private async attachSingleReviewStats(product: ProductBasic) {
    const [reviewAgg, soldAgg] = await Promise.all([
      this.prisma.productReview.aggregate({
        where: { productId: product.id },
        _count: { id: true },
        _avg: { rating: true },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          productId: product.id,
          order: { status: OrderStatus.DELIVERED },
        },
        _sum: { quantity: true },
      }),
    ]);
    return {
      ...product,
      reviewCount: reviewAgg._count.id,
      averageRating: Number(reviewAgg._avg.rating?.toFixed(1)) || 0,
      soldCount: soldAgg._sum.quantity ?? 0,
    };
  }

  async createProduct(dto: CreateProductDto, storeId: string) {
    await this.storeService.findStoreOrThrow(storeId);
    const product = await this.productRepo.createProduct(dto, storeId);
    return {
      product,
    };
  }

  async updateProduct(
    dto: UpdateProductDto,
    productId: string,
    userId: string,
  ) {
    const product = await this.findProductOrThrow(productId);
    const store = await this.storeService.findStoreOrThrow(product.storeId);
    checkOwnership(store.userId, userId, 'product');

    if (dto.imageUrl && product.imageUrl && dto.imageUrl !== product.imageUrl) {
      const oldPath = extractStoragePath(product.imageUrl, 'products');
      if (oldPath) {
        try {
          await this.storageService.deleteImage('products', oldPath);
        } catch {
          this.logger.warn(`Failed to delete old product image: ${oldPath}`);
        }
      }
    }

    return await this.productRepo.updateProductById(dto, productId);
  }



  async deleteProduct(productId: string, userId: string) {
    const product = await this.findProductOrThrow(productId);
    const store = await this.storeService.findStoreOrThrow(product.storeId);
    checkOwnership(store.userId, userId, 'product');
    return this.productRepo.deleteProductById(productId);
  }

  async getProduct(productId: string) {
    const product = await findOrThrow(
      () => this.productRepo.findProductById(productId),
      'product',
      productId,
    );
    const productWithStats = await this.attachSingleReviewStats(product);

    const storeReviewStats = await this.storeService.getStoreReviewStats(
      product.storeId,
    );

    const store = {
      ...productWithStats.store,
      name: productWithStats.store?.storeName ?? '',
      _count: {
        ...((productWithStats.store as Record<string, unknown>)?._count as Record<string, number>),
        reviews: storeReviewStats._count.id,
      },
      reviewStats: {
        averageRating: Number(storeReviewStats._avg.rating?.toFixed(1)) || 0,
        totalReviews: storeReviewStats._count.id,
      },
    };

    return {
      ...productWithStats,
      store,
    };
  }

  async getAllProducts(filter: GetProductFilterDto) {
    const {
      maxPrice,
      minPrice,
      search,
      storeId,
      category,
      page,
      limit,
      sortBy,
      showHidden,
    } = filter;
    const skip = (page - 1) * limit;

    const whereConditions: Prisma.ProductWhereInput = {};

    if (search) {
      whereConditions.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (storeId) {
      whereConditions.storeId = storeId;
    }

    if (!showHidden) {
      whereConditions.isHidden = false;
    }

    if (category) {
      whereConditions.category = category;
    }

    if (maxPrice !== undefined || minPrice !== undefined) {
      whereConditions.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    else if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else orderBy = { createdAt: 'desc' };

    if (sortBy === 'best_selling') {
      const allProducts = await this.productRepo.findAllProducts(
        whereConditions,
        0,
        1000,
        { createdAt: 'desc' },
      );
      const total = await this.productRepo.countProducts(whereConditions);
      const withStats = await this.attachReviewStats(allProducts);
      const sorted = withStats.sort((a, b) => b.soldCount - a.soldCount);
      const paginated = sorted.slice(skip, skip + limit);
      return {
        products: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    const [products, total] = await Promise.all([
      this.productRepo.findAllProducts(whereConditions, skip, limit, orderBy),
      this.productRepo.countProducts(whereConditions),
    ]);

    const productsWithStats = await this.attachReviewStats(products);

    return {
      products: productsWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
