import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { DiscountService } from "./discount.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { AdminGuard } from "src/common/guards/admin.guard";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { BuyerGuard } from "src/common/guards/buyer.guard";

@Controller("discounts")
@UseGuards(JwtAuthGuard)
export class DiscountController {
    constructor(private discountService : DiscountService) {}

    @Get()
    @UseGuards(BuyerGuard)
    async getDiscountForBuyer(@Query("code") code : string) {
        const getDiscountForBuyerResult = await this.discountService.getDiscountForBuyer(code)
        return {
            message : "find discount success",
            data : getDiscountForBuyerResult
        }
    }

    @Post()
    @UseGuards(AdminGuard)
    async createDiscount(@Body() dto : CreateDiscountDto) {
        const createDiscountResult = await this.discountService.createDiscount(dto)
        return {
            message : "create discount success",
            data : createDiscountResult
        }
    }

    @Patch(":discountId")
    @UseGuards(AdminGuard)
    async updateDiscount(@Body() dto : UpdateDiscountDto, @Param("discountId") discountId : string) {
        const updateDiscountResult = await this.discountService.updateDiscount(dto, discountId)
        return {
            message : "update discount success",
            data : updateDiscountResult
        }
    }

    @Delete(":discountId")
    @UseGuards(AdminGuard)
    async deleteDiscount(@Param("discountId") discountId : string) {
        const deleteDiscountResult = await this.discountService.deleteDiscount(discountId)
        return {
            message : "delete discount success",
            data : deleteDiscountResult
        }
    }

    @Get()
    @UseGuards(AdminGuard)
    async getAllDiscountsForAdmin() {
        const getAllDiscountsForAdminResult = await this.discountService.getAllDiscountForAdmin()
        return {
            message : "get all discounts success",
            data : getAllDiscountsForAdminResult
        }
    }

    @Get("admin/discounts/:discountId")
    @UseGuards(AdminGuard)
    async getDiscountForAdmin(@Param("discountId") discountId : string) {
        const getAllDiscountForAdminResult = await this.discountService.getDiscountForAdmin(discountId)
        return {
            message : "get discount success",
            data : getAllDiscountForAdminResult
        }
    }
}