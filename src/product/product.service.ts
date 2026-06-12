import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductRepository } from "./product.repository";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { StoreService } from "src/store/store.service";

@Injectable()
export class ProductService {
    constructor(
        private productRepo : ProductRepository,
        private storeService : StoreService
    ) {}

    async isProductExist(productId : string) {
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
        const product = await this.isProductExist(productId)
        const store = await this.storeService.findStoreOrThrow(product.storeId)
        if (store.userId !== userId) throw new ForbiddenException("You're not authorized to update this product")

        const updateProduct = {
            name : dto.name || product.name,
            description : dto.description || product.description,
            price : dto.price || product.price,
            stock : dto.stock || product.stock,
            imageurl : dto.stock || product.imageUrl
        }
        const productUpdated = await this.productRepo.updateProductById(updateProduct, productId)
        return {
            product : productUpdated
        }
    }

    async deleteProduct(productId : string, userId : string) {
        const product = await this.isProductExist(productId)
        const store = await this.storeService.findStoreOrThrow(product.storeId)
        if (store.userId !==  userId) throw new ForbiddenException(`you're not authorized to delete this product`)
        return this.productRepo.deleteProductById(productId)
    }

    async getProduct(productId : string) {
        const product = await this.productRepo.findProductById(productId)
        return {
            product
        }
    }

    async getAllProducts() {
        const products = await this.productRepo.findAllProducts()
        return {
            products
        }
    }
}