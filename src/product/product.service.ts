import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductRepository } from "./product.repository";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { StoreService } from "src/store/store.service";
import { Prisma } from "@prisma/client";
import { GetProductFilterDto } from "./dto/get-product-filter.dto";

@Injectable()
export class ProductService {
    constructor(
        private productRepo : ProductRepository,
        private storeService : StoreService
    ) {}

    async verifyAndReduceStock(tx : Prisma.TransactionClient, productId : string, quantity : number) {
        const result = await this.productRepo.reduceStockAtomically(tx, productId, quantity)
        if (result.count === 0) throw new BadRequestException(`Product is out of stock`)
    }

    async verifyAndRollbackStock(tx : Prisma.TransactionClient, productId : string, quantity : number) {
        const result = await this.productRepo.increaseStock(tx, productId, quantity)
        if (result.count === 0) throw new BadRequestException(`Product is not exist`)
    }

    async findProductOrThrow(productId : string) {
        const product = await this.productRepo.findProductById(productId)
        if (!product) throw new NotFoundException(`product with id : ${productId} not found`)
        return product
    }

    async createProduct(dto : CreateProductDto, storeId : string) {
        await this.storeService.findStoreOrThrow(storeId)
        const product = await this.productRepo.createProduct(dto, storeId)
        return {
            product
        }
    }

    async updateProduct(dto : UpdateProductDto, productId : string, userId : string) {
        const product = await this.findProductOrThrow(productId)
        const store = await this.storeService.findStoreOrThrow(product.storeId)
        if (store.userId !== userId) throw new ForbiddenException("You're not authorized to update this product")

        return await this.productRepo.updateProductById(dto, productId)
    }

    async deleteProduct(productId : string, userId : string) {
        const product = await this.findProductOrThrow(productId)
        const store = await this.storeService.findStoreOrThrow(product.storeId)
        if (store.userId !==  userId) throw new ForbiddenException(`you're not authorized to delete this product`)
        return this.productRepo.deleteProductById(productId)
    }

    async getProduct(productId : string) {
        return await this.productRepo.findProductById(productId)
    }

    async getAllProducts(filter : GetProductFilterDto) {
        const { maxPrice, minPrice, search, storeId, page, limit } = filter
        const skip = (page - 1) * limit

        const whereConditions : any = {}

        if (search) {
            whereConditions.name = {
                contains : search,
                mode : 'insensitive'
            }
        }

        if (storeId) {
            whereConditions.storeId = storeId
        }

        if (maxPrice !== undefined || minPrice !== undefined) {
            whereConditions.price = {
                ...(minPrice !== undefined && {gte : minPrice}),
                ...(maxPrice !== undefined && {lte : maxPrice}),
            }
        }

        const [products, total] = await Promise.all([
            this.productRepo.findAllProducts(whereConditions, skip, limit),
            this.productRepo.countProducts(whereConditions)
        ])

        return {
            products,
            total,
            page,
            limit,
            totalPages : Math.ceil(total / limit)
        }
    }
}