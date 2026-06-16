import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductRepository {
    constructor(private prisma : PrismaService) {}

    async createProduct(dto : CreateProductDto, storeId : string) {
        return this.prisma.product.create({
            data : {
                name : dto.name,
                price : dto.price,
                stock : dto.stock,
                description : dto.description,
                imageUrl : dto.imageUrl,
                storeId
            }
        })
    }

    async reduceStockAtomically(tx : Prisma.TransactionClient, productId : string, quantity : number) {
        return tx.product.updateMany({
            where : {
                id : productId,
                stock : { gte : quantity }
            },
            data : {
                stock : { decrement : quantity }
            }
        })
    }

    async increaseStock(tx : Prisma.TransactionClient, productId : string, quantity : number) {
        return tx.product.updateMany({
            where : { id : productId },
            data : {
                stock : { increment : quantity }
            }
        })
    }

    async findAllProducts(whereConditions : any) {
        return this.prisma.product.findMany({
            where : whereConditions,
            orderBy : {
                createdAt : 'desc'
            }
        })
    }

    async findProductById(productId : string) {
        return this.prisma.product.findUnique({
            where : {
                id : productId
            }
        })
    }

    async deleteProductById(productId : string) {
        return this.prisma.product.delete({
            where : {
                id : productId
            }
        })
    }

    async updateProductById(dto : UpdateProductDto, productId : string) {
        return this.prisma.product.update({
            where : {
                id : productId
            }, 
            data : dto
        })
    }
}