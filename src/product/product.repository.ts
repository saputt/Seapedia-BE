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

    async findFreshProductWithTransaction(tx : Prisma.TransactionClient, productId : string) {
        return tx.product.findUnique({
            where : {
                id : productId
            }
        })
    }

    async updateProductStockWithTransaction(tx : Prisma.TransactionClient, productId : string, freshStock : number, quantity : number) {
        return tx.product.update({
            where : {
                id : productId
            },
            data : {
                stock : freshStock - quantity
            }  
        })
    }

    async findAllProducts() {
        return this.prisma.product.findMany()
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
            data : {
                name : dto.name,
                stock : dto.stock,
                price : dto.price,
                description : dto.description,
                imageUrl : dto.imageUrl
            }
        })
    }
}