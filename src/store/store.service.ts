import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-update.dto';
import { Prisma } from '@prisma/client';
import { findOrThrow, checkOwnership } from 'src/common/helpers/prisma.helper';

/**
 * Service untuk mengelola toko.
 * Menyediakan pembuatan toko baru, pembaruan data toko, dan pencarian toko.
 * Validasi bahwa setiap pengguna hanya bisa memiliki satu toko,
 * dan nama toko harus unik di seluruh platform.
 */
@Injectable()
export class StoreService {
  constructor(private storeRepo: StoreRepository) {}

  async isStoreAlreadyExist(storeName: string) {
    const store = await this.storeRepo.findStoreByName(storeName);
    if (store)
      throw new ConflictException(`storename : ${storeName} already exist`);
    return false;
  }

  async isUserAlreadyHaveStore(userId: string) {
    const store = await this.storeRepo.findStoreByUserId(userId);
    if (store) throw new ConflictException('You already have store');
    return false;
  }

  async findUserStore(userId: string) {
    return this.storeRepo.findStoreByUserId(userId);
  }

  async findStoreOrThrow(storeId: string, tx?: Prisma.TransactionClient) {
    return findOrThrow(
      () => this.storeRepo.findStoreById(storeId, tx),
      'store',
      storeId,
    );
  }

  async createStore(dto: CreateStoreDto, userId: string) {
    await this.isUserAlreadyHaveStore(userId);
    await this.isStoreAlreadyExist(dto.storeName);
    return await this.storeRepo.createStore(dto, userId);
  }

  async updateStore(dto: UpdateStoreDto, storeId: string, userId: string) {
    const store = await this.findStoreOrThrow(storeId);
    checkOwnership(store.userId, userId, 'store');
    if (dto.storeName) {
      await this.isStoreAlreadyExist(dto.storeName);
    }
    return await this.storeRepo.updateStore(dto, storeId);
  }
}
