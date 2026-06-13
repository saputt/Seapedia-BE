import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

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
}