import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";

@Injectable()
export class StoreRepository {
    constructor(private prisma : PrismaService) {}

    async createStore(dto : CreateStoreDto, userId : string) {
        return this.prisma.store.create({
            data : {
                storeName : dto.storeName,
                description : dto.description,
                userId : userId
            }
        })
    }

    async findStoreByName(storeName : string) {
        return this.prisma.store.findUnique({
            where : {
                storeName
            }
        })
    }

    async findStoreById(storeId : string) {
        return this.prisma.store.findUnique({
            where : {
                id : storeId
            }
        })
    }

    async updateStore(dto : UpdateStoreDto, storeId : string) {
        return this.prisma.store.update({
            where : {
                id : storeId
            },
            data : dto
        })
    }

    async findStoreByUserId(userId : string) {
        return this.prisma.store.findFirst({
            where : {
                userId
            }
        })
    }
}