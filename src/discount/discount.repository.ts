import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class DiscountRepository {
    constructor(private prisma : PrismaService) {}
    
    async findDiscountById(discountId : string, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.discount.findUnique({
            where : {
                id : discountId
            }
        })
    }

    async findDiscountByCode(discountCode : string, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.discount.findUnique({
            where : {
                code : discountCode
            }
        })
    }

    async createDiscount(dto : CreateDiscountDto) {
        return this.prisma.discount.create({
            data : dto
        })
    }

    async findAllDiscountsForAdmin() {
        return this.prisma.discount.findMany()
    }

    async updateDiscount(discountId : string, dto : UpdateDiscountDto) {
        return this.prisma.discount.update({
            where : {
                id : discountId
            },
            data : dto
        })
    }

    async deleteDiscount(discountId : string) {
        return this.prisma.discount.delete({
            where : {
                id : discountId
            }
        })
    }

    async updateDiscountUsedCount(discountId : string, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma 
        return prismaClient.discount.update({
            where : {
                id : discountId,
            },
            data : {
                usedCount : {
                    increment : 1
                }
            }
        })
    }
}