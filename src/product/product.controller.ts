import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { SellerGuard } from "src/common/guards/seller.guard";
import { UpdateProductDto } from "./dto/update-product.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Products")
@Controller("products")
export class ProductController {
    constructor(private productService : ProductService) {}

    @Post(":storeId")
    @UseGuards(JwtAuthGuard, SellerGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary : "Create a new product in a store" })
    @ApiResponse({ status : 201, description : "Product created successfully" })
    @ApiResponse({ status : 400, description : "Validation error" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Seller only" })
    @ApiResponse({ status : 404, description : "Store not found" })
    async createProduct(@Param("storeId") storeId : string, @Body() dto : CreateProductDto) {
        const createProductResult = await this.productService.createProduct(dto, storeId)
        return {
            message : "create product success",
            data : createProductResult
        }
    }

    @Put(":productId")
    @UseGuards(JwtAuthGuard, SellerGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary : "Update an existing product" })
    @ApiResponse({ status : 200, description : "Product updated successfully" })
    @ApiResponse({ status : 400, description : "Validation error" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Not the store owner" })
    @ApiResponse({ status : 404, description : "Product not found" })
    async updateProduct(@Param("productId") productId : string, @Body() dto : UpdateProductDto, @GetUser("id") userId : string) {
        const updateProductResult = await this.productService.updateProduct(dto, productId, userId)
        return {
            message : "update product success",
            data : updateProductResult
        }
    }

    @Delete(":productId")
    @UseGuards(JwtAuthGuard, SellerGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary : "Delete a product" })
    @ApiResponse({ status : 200, description : "Product deleted successfully" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Not the store owner" })
    @ApiResponse({ status : 404, description : "Product not found" })
    async deleteProduct(@Param("productId") productId : string, @GetUser("id") userId : string) {
        const deleteProductResult = await this.productService.deleteProduct(productId, userId)
        return {
            message : `delete product : ${deleteProductResult.name} success`,
            data : null
        }
    }

    @Get(":productId")
    @ApiOperation({ summary : "Get product by ID (public)" })
    @ApiResponse({ status : 200, description : "Product found" })
    @ApiResponse({ status : 404, description : "Product not found" })
    async getProduct(@Param("productId") productId : string) {
        const getProductResult = await this.productService.findProductOrThrow(productId)
        return {
            message : `get product ${getProductResult.name} success`,
            data : getProductResult
        }
    }

    @Get()
    @ApiOperation({ summary : "Get all products (public)" })
    @ApiResponse({ status : 200, description : "Products list retrieved" })
    async getAllProducts() {
        const getAllProductsResult = await this.productService.getAllProducts()
        return {
            message : "get all products success",
            data : getAllProductsResult
        }
    }
}