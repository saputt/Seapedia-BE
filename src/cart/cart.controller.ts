import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BuyerGuard } from 'src/common/guards/buyer.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard, BuyerGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Post(':productId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a product to cart' })
  @ApiResponse({ status: 201, description: 'Product added to cart' })
  @ApiResponse({
    status: 400,
    description:
      'Validation error, stock insufficient, or cart must be one store only',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Buyer only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToCart(
    @Body() dto: AddToCartDto,
    @Param('productId') productId: string,
    @GetUser('id') userId: string,
  ) {
    const addToCartResult = await this.cartService.addToCart(
      dto,
      userId,
      productId,
    );
    return {
      message: 'add to cart successful',
      data: addToCartResult,
    };
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user cart items' })
  @ApiResponse({ status: 200, description: 'Cart items retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Buyer only' })
  async getUserCart(@GetUser('id') userId: string) {
    const getUserCartResult = await this.cartService.getUserCart(userId);
    return {
      message: 'get user cart success',
      data: getUserCartResult,
    };
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Buyer only' })
  async clearUserCart(@GetUser('id') userId: string) {
    await this.cartService.clearUserCart(userId);
    return {
      message: 'clear user cart success',
      data: null,
    };
  }

  @Patch(':productId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item quantity updated' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or stock insufficient',
  })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateCartItem(
    @Body() dto: UpdateCartItemDto,
    @Param('productId') productId: string,
    @GetUser('id') userId: string,
  ) {
    const updateCartItemResult = await this.cartService.updateCartItem(
      productId,
      userId,
      dto.quantity,
    );
    return {
      message: 'update cart item success',
      data: updateCartItemResult,
    };
  }

  @Delete(':productId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a single item from cart' })
  @ApiResponse({ status: 200, description: 'Cart item removed' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeCartItem(
    @Param('productId') productId: string,
    @GetUser('id') userId: string,
  ) {
    await this.cartService.deleteCartItem(productId, userId);
    return {
      message: 'remove cart item success',
      data: null,
    };
  }
}
