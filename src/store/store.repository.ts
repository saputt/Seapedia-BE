import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Prisma } from '@prisma/client';
import { BaseRepository } from 'src/common/repositories/base.repository';

/**
 * Repository untuk akses data toko di database.
 * Menangani operasi CRUD toko dan pencarian toko berdasarkan nama atau pengguna.
 */
@Injectable()
export class StoreRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createStore(dto: CreateStoreDto, userId: string) {
    return this.prisma.store.create({
      data: {
        storeName: dto.storeName,
        description: dto.description,
        address: dto.address,
        userId: userId,
      },
    });
  }

  async findStoreByName(storeName: string) {
    return this.prisma.store.findUnique({
      where: {
        storeName,
      },
    });
  }

  async findStoreById(storeId: string, tx?: Prisma.TransactionClient) {
    return this.getPrismaClient(tx).store.findUnique({
      where: {
        id: storeId,
      },
    });
  }

  async updateStore(dto: UpdateStoreDto, storeId: string) {
    return this.prisma.store.update({
      where: {
        id: storeId,
      },
      data: dto,
    });
  }

  async findStoreByUserId(userId: string) {
    return this.prisma.store.findFirst({
      where: {
        userId,
      },
    });
  }

  async getStoreProductReviewStats(storeId: string) {
    return this.prisma.productReview.aggregate({
      where: { product: { storeId } },
      _count: { id: true },
      _avg: { rating: true },
    });
  }
}
