import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductRepository } from "./product.repository";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { StoreService } from "src/store/store.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductService {
    constructor(
        private productRepo : ProductRepository,
        private storeService : StoreService
    ) {}

    async verifyAndReduceStock(tx : Prisma.TransactionClient, productId : string, quantity : number) {
        const product = await this.productRepo.findFreshProductWithTransaction(tx, productId)
        if (!product || product.stock < quantity) throw new BadRequestException(`Product ${product.name} is out of stock`)
        await this.productRepo.updateProductStockWithTransaction(tx, productId, product.stock, quantity)
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

        const updateProduct = {
            name : dto.name || product.name,
            description : dto.description || product.description,
            price : dto.price || product.price,
            stock : dto.stock || product.stock,
            imageurl : dto.imageUrl || product.imageUrl
        }
        return await this.productRepo.updateProductById(updateProduct, productId)
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

    async getAllProducts() {
        return await this.productRepo.findAllProducts()
    }
}