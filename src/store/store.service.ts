import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { StoreRepository } from './store.repository';
import { AuthRepository } from '../auth/auth.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Prisma } from '@prisma/client';
import { findOrThrow, checkOwnership } from 'src/common/helpers/prisma.helper';
import { StorageService } from 'src/storage/storage.service';

/**
 * Service untuk mengelola toko.
 * Menyediakan pembuatan toko baru, pembaruan data toko, dan pencarian toko.
 * Validasi bahwa setiap pengguna hanya bisa memiliki satu toko,
 * dan nama toko harus unik di seluruh platform.
 */
@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private storeRepo: StoreRepository,
    private authRepo: AuthRepository,
    private storageService: StorageService,
  ) {}

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
    const store = await this.storeRepo.createStore(dto, userId);

    await this.authRepo.addRoleToUser(userId, RoleName.SELLER);

    return store;
  }

  async updateStore(dto: UpdateStoreDto, storeId: string, userId: string) {
    const store = await this.findStoreOrThrow(storeId);
    checkOwnership(store.userId, userId, 'store');
    if (dto.storeName && store.userId !== userId) {
      await this.isStoreAlreadyExist(dto.storeName);
    }

    if (dto.imageUrl && store.imageUrl && dto.imageUrl !== store.imageUrl) {
      const oldPath = this.extractStoragePath(store.imageUrl, 'profiles');
      if (oldPath) {
        try {
          await this.storageService.deleteImage('profiles', oldPath);
        } catch {
          this.logger.warn(`Failed to delete old store image: ${oldPath}`);
        }
      }
    }

    return await this.storeRepo.updateStore(dto, storeId);
  }

  private extractStoragePath(publicUrl: string, bucket: string): string | null {
    try {
      const url = new URL(publicUrl);
      const pathParts = url.pathname.split(
        `/storage/v1/object/public/${bucket}/`,
      );
      return pathParts[1] || null;
    } catch {
      return null;
    }
  }
}
