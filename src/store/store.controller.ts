import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { StoreService } from "./store.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { SellerGuard } from "src/common/guards/seller.guard";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";

@Controller("stores")
@UseGuards(JwtAuthGuard, SellerGuard)
export class StoreController {
    constructor(private storeService : StoreService) {}

    @Post()
    async createStore(@Body() dto : CreateStoreDto, @GetUser('id') userId : string) {
        const createStoreResult = await this.storeService.createStore(dto, userId)
        return {
            message : "create store success",
            data : createStoreResult
        }
    }

    @Put(":storeId")
    async updateStore(@Body() dto : UpdateStoreDto, @Param("storeId") storeId : string, @GetUser('id') userId : string) {
        const updateStoreResult = await this.storeService.updateStore(dto, storeId, userId)
        return {
            message : `update store success`,
            data : updateStoreResult
        }
    }

    @Get(":storeId")
    async getStoreById(@Param("storeId") storeId : string) {
        const getStoreByIdResult = await this.storeService.findStoreOrThrow(storeId)
        return {
            message : `get store with id : ${storeId} success`,
            data : getStoreByIdResult
        }
    }
}