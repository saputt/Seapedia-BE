import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DiscountService } from "./discount.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { AdminGuard } from "src/common/guards/admin.guard";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { BuyerGuard } from "src/common/guards/buyer.guard";

@ApiTags("Discounts")
@Controller("discounts")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiscountController {
    constructor(private discountService : DiscountService) {}

    @Get("check")
    @UseGuards(BuyerGuard)
    @ApiOperation({ summary : "Check discount by code (Buyer)" })
    @ApiQuery({ name : "code", type : String, description : "Discount code to check" })
    @ApiResponse({ status : 200, description : "Discount found" })
    @ApiResponse({ status : 400, description : "Discount expired or not available" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Only buyer can access" })
    @ApiResponse({ status : 404, description : "Discount not found" })
    async getDiscountForBuyer(@Query("code") code : string) {
        const getDiscountForBuyerResult = await this.discountService.getDiscountForBuyer(code)
        return {
            message : "find discount success",
            data : getDiscountForBuyerResult
        }
    }

    @Get(":discountId")
    @UseGuards(AdminGuard)
    @ApiOperation({ summary : "Get discount by ID (Admin)" })
    @ApiResponse({ status : 200, description : "Discount retrieved" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Only admin can access" })
    @ApiResponse({ status : 404, description : "Discount not found" })
    async getDiscountForAdmin(@Param("discountId") discountId : string) {
        const getAllDiscountForAdminResult = await this.discountService.getDiscountForAdmin(discountId)
        return {
            message : "get discount success",
            data : getAllDiscountForAdminResult
        }
    }

    @Get("all")
    @UseGuards(AdminGuard)
    @ApiOperation({ summary : "Get all discounts (Admin)" })
    @ApiResponse({ status : 200, description : "All discounts retrieved" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Only admin can access" })
    async getAllDiscountsForAdmin() {
        const getAllDiscountsForAdminResult = await this.discountService.getAllDiscountForAdmin()
        return {
            message : "get all discounts success",
            data : getAllDiscountsForAdminResult
        }
    }

    @Post()
    @UseGuards(AdminGuard)
    @ApiOperation({ summary : "Create a new discount (Admin)" })
    @ApiResponse({ status : 201, description : "Discount created" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Only admin can access" })
    @ApiResponse({ status : 409, description : "Discount code already exists" })
    async createDiscount(@Body() dto : CreateDiscountDto) {
        const createDiscountResult = await this.discountService.createDiscount(dto)
        return {
            message : "create discount success",
            data : createDiscountResult
        }
    }

    @Patch(":discountId")
    @UseGuards(AdminGuard)
    @ApiOperation({ summary : "Update a discount (Admin)" })
    @ApiResponse({ status : 200, description : "Discount updated" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Only admin can access" })
    @ApiResponse({ status : 404, description : "Discount not found" })
    async updateDiscount(@Body() dto : UpdateDiscountDto, @Param("discountId") discountId : string) {
        const updateDiscountResult = await this.discountService.updateDiscount(dto, discountId)
        return {
            message : "update discount success",
            data : updateDiscountResult
        }
    }

    @Delete(":discountId")
    @UseGuards(AdminGuard)
    @ApiOperation({ summary : "Delete a discount (Admin)" })
    @ApiResponse({ status : 200, description : "Discount deleted" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Only admin can access" })
    @ApiResponse({ status : 404, description : "Discount not found" })
    async deleteDiscount(@Param("discountId") discountId : string) {
        const deleteDiscountResult = await this.discountService.deleteDiscount(discountId)
        return {
            message : "delete discount success",
            data : deleteDiscountResult
        }
    }
}