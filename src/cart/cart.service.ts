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

  async addToCart(dto: AddToCartDto, userId: string, productId: string) {
    const product = await this.productService.findProductOrThrow(productId);
    const cart = await this.cartRepo.findUserCartItems(userId);
    const productInCart = cart.find((p) => p.productId === productId);
    if (cart.length > 0 && product.storeId !== cart[0].product.storeId)
      throw new BadRequestException('cart must be one store only');
    const totalProductInCart = productInCart
      ? productInCart.quantity + dto.quantity
      : dto.quantity;
    if (totalProductInCart > product.stock)
      throw new BadRequestException('Bad Request. Stock are not enough');
    if (cart.length > 0 && productInCart) {
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
    const cart = await this.cartRepo.findUserCartItems(userId);
    const cartItem = cart.find((c) => c.productId === productId);
    if (!cartItem) throw new BadRequestException('Cart item not found');
    if (quantity > product.stock)
      throw new BadRequestException('Stock are not enough');
    return this.cartRepo.updateCartItemQuantity(cartItem.id, quantity);
  }

  async deleteCartItem(productId: string, userId: string) {
    const cart = await this.cartRepo.findUserCartItems(userId);
    const cartItem = cart.find((c) => c.productId === productId);
    if (!cartItem) throw new BadRequestException('Cart item not found');
    return this.cartRepo.deleteCartItem(cartItem.id);
  }
}
