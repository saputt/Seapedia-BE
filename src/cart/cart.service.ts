import { BadRequestException, Injectable } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { ProductService } from 'src/product/product.service';
import { Prisma } from '@prisma/client';
import { AddToCartDto } from './dto/add-to-cart.dto';

/**
 * Service untuk mengelola keranjang belanja.
 * Menangani penambahan, pembaruan, penghapusan item, dan pengosongan keranjang.
 * Validasi bahwa semua item dalam keranjang harus dari toko yang sama.
 * Jika produk sudah ada di keranjang, quantity akan ditambah (bukan duplikat).
 */
@Injectable()
export class CartService {
  constructor(
    private cartRepo: CartRepository,
    private productService: ProductService,
  ) {}

  async addToCart(
    dto: AddToCartDto,
    userId: string,
    productId: string,
    force = false,
  ) {
    const product = await this.productService.findProductOrThrow(productId);

    if (force) {
      await this.cartRepo.deleteUserCart(userId);
    }

    const productInCart = await this.cartRepo.findCartItemByProduct(
      productId,
      userId,
    );

    const existingCartItems = await this.cartRepo.findUserCartItems(userId);
    const differentStoreItem = existingCartItems.find(
      (item) => item.product.storeId !== product.storeId,
    );

    if (differentStoreItem && !force) {
      throw new BadRequestException({
        message: 'cart must be one store only',
        code: 'DIFFERENT_STORE_IN_CART',
        currentStoreId: differentStoreItem.product.storeId,
        newStoreId: product.storeId,
      });
    }

    if (productInCart && product.storeId !== productInCart.product.storeId)
      throw new BadRequestException('cart must be one store only');
    const totalProductInCart = productInCart
      ? productInCart.quantity + dto.quantity
      : dto.quantity;
    if (totalProductInCart > product.stock)
      throw new BadRequestException('Bad Request. Stock are not enough');
    if (productInCart) {
      return this.cartRepo.addQuantityCart(productInCart.id, dto.quantity);
    }

    return this.cartRepo.addToCart(dto.quantity, productId, userId);
  }

  async getUserCart(userId: string) {
    return await this.cartRepo.findUserCartItems(userId);
  }

  async clearUserCart(userId: string, tx?: Prisma.TransactionClient) {
    return this.cartRepo.deleteUserCart(userId, tx ?? null);
  }

  async updateCartItem(productId: string, userId: string, quantity: number) {
    const product = await this.productService.findProductOrThrow(productId);
    const cartItem = await this.cartRepo.findCartItemByProduct(
      productId,
      userId,
    );
    if (!cartItem) throw new BadRequestException('Cart item not found');
    if (quantity > product.stock)
      throw new BadRequestException('Stock are not enough');
    return this.cartRepo.updateCartItemQuantity(cartItem.id, quantity);
  }

  async deleteCartItem(productId: string, userId: string) {
    const cartItem = await this.cartRepo.findCartItemByProduct(
      productId,
      userId,
    );
    if (!cartItem) throw new BadRequestException('Cart item not found');
    return this.cartRepo.deleteCartItem(cartItem.id);
  }
}
