import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { StoreService } from "./store.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { SellerGuard } from "src/common/guards/seller.guard";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Stores")
@Controller("stores")
export class StoreController {
    constructor(private storeService : StoreService) {}

    @Post()
    @UseGuards(JwtAuthGuard, SellerGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary : "Create a new store" })
    @ApiResponse({ status : 201, description : "Store created successfully" })
    @ApiResponse({ status : 400, description : "Validation error" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Seller only" })
    @ApiResponse({ status : 409, description : "Store name already exists or user already has a store" })
    async createStore(@Body() dto : CreateStoreDto, @GetUser("id") userId : string) {
        const createStoreResult = await this.storeService.createStore(dto, userId)
        return {
            message : "create store success",
            data : createStoreResult
        }
    }

    @Put(":storeId")
    @UseGuards(JwtAuthGuard, SellerGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary : "Update store details" })
    @ApiResponse({ status : 200, description : "Store updated successfully" })
    @ApiResponse({ status : 400, description : "Validation error" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Seller only" })
    @ApiResponse({ status : 404, description : "Store not found" })
    @ApiResponse({ status : 409, description : "Store name already exists" })
    async updateStore(@Body() dto : UpdateStoreDto, @Param("storeId", ParseUUIDPipe) storeId : string, @GetUser("id") userId : string) {
        const updateStoreResult = await this.storeService.updateStore(dto, storeId, userId)
        return {
            message : "update store success",
            data : updateStoreResult
        }
    }

    @Get("my")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary : "Get current user's store" })
    @ApiResponse({ status : 200, description : "Store found or null" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    async getMyStore(@GetUser("id") userId : string) {
        const store = await this.storeService.findUserStore(userId)
        return {
            message : store ? "store found" : "user has no store",
            data : store
        }
    }

    @Get(":storeId")
    @ApiOperation({ summary : "Get store by ID (public)" })
    @ApiResponse({ status : 200, description : "Store found" })
    @ApiResponse({ status : 404, description : "Store not found" })
    async getStoreById(@Param("storeId", ParseUUIDPipe) storeId : string) {
        const getStoreByIdResult = await this.storeService.findStoreOrThrow(storeId)
        return {
            message : `get store with id : ${storeId} success`,
            data : getStoreByIdResult
        }
    }
}