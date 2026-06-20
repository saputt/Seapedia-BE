import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductRepository } from "./product.repository";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { StoreService } from "src/store/store.service";
import { Prisma, OrderStatus } from "@prisma/client";
import { GetProductFilterDto } from "./dto/get-product-filter.dto";
import { PrismaService } from "src/prisma/prisma.service";

/**
 * Service untuk mengelola produk.
 * Menyediakan CRUD produk, validasi stok (pengurangan dan pengembalian),
 * serta pencarian dengan filter (harga, kategori, pencarian, sorting).
 * Setiap produk dilengkapi dengan statistik review (rating rata-rata, jumlah review)
 * dan jumlah terjual.
 */
@Injectable()
export class ProductService {
    constructor(
        private productRepo : ProductRepository,
        private storeService : StoreService,
        private prisma : PrismaService
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

    private async attachReviewStats(products : any[]) {
        if (products.length === 0) return products
        const ids = products.map(p => p.id)
        const [reviewStats, soldStats] = await Promise.all([
            this.prisma.productReview.groupBy({
                by : ["productId"],
                where : { productId : { in : ids } },
                _count : { id : true },
                _avg : { rating : true }
            }),
            this.prisma.orderItem.groupBy({
                by : ["productId"],
                where : { productId : { in : ids }, order : { status : OrderStatus.DELIVERED } },
                _sum : { quantity : true }
            })
        ])
        const reviewMap = new Map(reviewStats.map(s => [s.productId, { reviewCount : s._count.id, averageRating : Number(s._avg.rating?.toFixed(1)) || 0 }]))
        const soldMap = new Map(soldStats.map(s => [s.productId, s._sum.quantity ?? 0]))
        return products.map(p => ({
            ...p,
            reviewCount : reviewMap.get(p.id)?.reviewCount ?? 0,
            averageRating : reviewMap.get(p.id)?.averageRating ?? 0,
            soldCount : soldMap.get(p.id) ?? 0
        }))
    }

    private async attachSingleReviewStats(product : any) {
        const [reviewAgg, soldAgg] = await Promise.all([
            this.prisma.productReview.aggregate({
                where : { productId : product.id },
                _count : { id : true },
                _avg : { rating : true }
            }),
            this.prisma.orderItem.aggregate({
                where : { productId : product.id, order : { status : OrderStatus.DELIVERED } },
                _sum : { quantity : true }
            })
        ])
        return {
            ...product,
            reviewCount : reviewAgg._count.id,
            averageRating : Number(reviewAgg._avg.rating?.toFixed(1)) || 0,
            soldCount : soldAgg._sum.quantity ?? 0
        }
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
        const product = await this.productRepo.findProductById(productId)
        if (!product) throw new NotFoundException(`product with id : ${productId} not found`)
        return this.attachSingleReviewStats(product)
    }

    async getAllProducts(filter : GetProductFilterDto) {
        const { maxPrice, minPrice, search, storeId, category, page, limit, sortBy } = filter
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

        if (category) {
            whereConditions.category = category
        }

        if (maxPrice !== undefined || minPrice !== undefined) {
            whereConditions.price = {
                ...(minPrice !== undefined && {gte : minPrice}),
                ...(maxPrice !== undefined && {lte : maxPrice}),
            }
        }

        let orderBy : any = { createdAt : 'desc' }

        if (sortBy === "price_asc") orderBy = { price : 'asc' }
        else if (sortBy === "price_desc") orderBy = { price : 'desc' }
        else if (sortBy === "oldest") orderBy = { createdAt : 'asc' }
        else orderBy = { createdAt : 'desc' }

        const [products, total] = await Promise.all([
            this.productRepo.findAllProducts(whereConditions, skip, limit, orderBy),
            this.productRepo.countProducts(whereConditions)
        ])

        const productsWithStats = await this.attachReviewStats(products)

        return {
            products : productsWithStats,
            total,
            page,
            limit,
            totalPages : Math.ceil(total / limit)
        }
    }
}