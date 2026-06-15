import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { SellerGuard } from "src/common/guards/seller.guard";
import { UpdateProductDto } from "./dto/update-product.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";

@Controller('products')
export class ProductController {
    constructor(private productService : ProductService) {}

    @Post(':storeId')
    @UseGuards(JwtAuthGuard, SellerGuard)
    async createProduct(@Param('storeId') storeId : string, @Body() dto : CreateProductDto) {
        const createProductResult = await this.productService.createProduct(dto, storeId)
        return {
            message : "create product success",
            data : createProductResult
        }
    }

    @Put(":productId")
    @UseGuards(JwtAuthGuard, SellerGuard)
    async updateProduct(@Param("productId") productId : string, @Body() dto : UpdateProductDto, @GetUser('id') userId : string) {
        const updateProductResult = await this.productService.updateProduct(dto, productId, userId)
        return {
            message : `update product success`,
            data : updateProductResult
        }
    }

    @Delete(":productId")
    @UseGuards(JwtAuthGuard, SellerGuard)
    async deleteProduct(@Param("productId") productId : string, @GetUser('id') userId : string) {
        const deleteProductResult = await this.productService.deleteProduct(productId, userId)
        return {
            message : `delete product : ${deleteProductResult.name} success`,
            data : null
        }
    }

    @Get(":productId")
    async getProduct(@Param("productId") productId : string) {
        const getProductResult = await this.productService.findProductOrThrow(productId)
        return {
            message : `get product ${getProductResult.name} success`,
            data : getProductResult
        }
    }

    @Get()
    async getAllProducts() {
        const getAllProductsResult = await this.productService.getAllProducts()
        return {
            message : "get all products success",
            data : getAllProductsResult
        }
    }
}