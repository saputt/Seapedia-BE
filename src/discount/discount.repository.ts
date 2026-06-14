import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";

@Injectable()
export class DiscountRepository {
    constructor(private prisma : PrismaService) {}
    
    async findDiscountById(discountId : string) {
        return this.prisma.discount.findUnique({
            where : {
                id : discountId
            }
        })
    }

    async findDiscountByCode(discountCode : string) {
        return this.prisma.discount.findUnique({
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
}