import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { RoleName } from '@prisma/client';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetProductFilterDto } from './dto/get-product-filter.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post(':storeId')
  @UseGuards(JwtAuthGuard, RoleGuard(RoleName.SELLER))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product in a store' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Seller only' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async createProduct(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateProductDto,
  ) {
    const createProductResult = await this.productService.createProduct(
      dto,
      storeId,
    );
    return {
      message: 'create product success',
      data: createProductResult,
    };
  }

  @Put(':productId')
  @UseGuards(JwtAuthGuard, RoleGuard(RoleName.SELLER))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not the store owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
    @GetUser('id') userId: string,
  ) {
    const updateProductResult = await this.productService.updateProduct(
      dto,
      productId,
      userId,
    );
    return {
      message: 'update product success',
      data: updateProductResult,
    };
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard, RoleGuard(RoleName.SELLER))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not the store owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @GetUser('id') userId: string,
  ) {
    const deleteProductResult = await this.productService.deleteProduct(
      productId,
      userId,
    );
    return {
      message: `delete product : ${deleteProductResult.name} success`,
      data: null,
    };
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get product by ID (public)' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    const getProductResult = await this.productService.getProduct(productId);
    return {
      message: `get product ${getProductResult.name} success`,
      data: getProductResult,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all products (public)' })
  @ApiResponse({ status: 200, description: 'Products list retrieved' })
  async getAllProducts(@Query() filterDto: GetProductFilterDto) {
    const getAllProductsResult =
      await this.productService.getAllProducts(filterDto);
    return {
      message: 'get all products success',
      data: getAllProductsResult,
    };
  }
}
