import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { StoreRepository } from "./store.repository";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class StoreService {
    constructor(private storeRepo : StoreRepository) {}

    async isStoreAlreadyExist(storeName : string) {
        const store = await this.storeRepo.findStoreByName(storeName)
        if (store) throw new ConflictException(`storename : ${storeName} already exist`)
        return false
    }

    async isUserAlreadyHaveStore(userId : string) {
        const store = await this.storeRepo.findStoreByUserId(userId)
        if (store) throw new ConflictException("You already have store")
        return false
    }

    async findUserStore(userId : string) {
        return this.storeRepo.findStoreByUserId(userId)
    }

    async findStoreOrThrow(storeId : string, tx? : Prisma.TransactionClient) {
        const store = await this.storeRepo.findStoreById(storeId, tx)
        if (!store) throw new NotFoundException(`store with id : ${storeId} not found`)
        return store
    }

    async createStore(dto : CreateStoreDto, userId : string) {
        await this.isUserAlreadyHaveStore(userId)
        await this.isStoreAlreadyExist(dto.storeName)
        return await this.storeRepo.createStore(dto, userId)
    }

    async updateStore(dto : UpdateStoreDto, storeId : string, userId : string) {
        const store = await this.findStoreOrThrow(storeId)
        if (store.userId !== userId) throw new UnauthorizedException("You're not authorized to update this store")
        if (dto.storeName) {
            await this.isStoreAlreadyExist(dto.storeName)
        }
        return await this.storeRepo.updateStore(dto, storeId)
    }
}