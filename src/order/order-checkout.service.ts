import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderSummaryDto } from './dto/order-summary.dto';
import {
  Discount,
  OrderStatus,
  ShippingMethod,
  WalletType,
} from '@prisma/client';
import { DiscountService } from 'src/discount/discount.service';
import { AddressService } from 'src/address/address.service';
import { WalletService } from 'src/wallet/wallet.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartService } from 'src/cart/cart.service';
import { StoreService } from 'src/store/store.service';
import { ProductService } from 'src/product/product.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  IOrderProductItem,
  IOrderSummaryPayload,
  SHIPPING_LIST,
} from './types/order.types';

/**
 * Service untuk menangani checkout dan ringkasan order.
 * Bertanggung jawab untuk membuat ringkasan order, memproses pembayaran,
 * dan membuat pesanan baru.
 */
@Injectable()
export class OrderCheckoutService {
  constructor(
    private orderRepo: OrderRepository,
    private storeService: StoreService,
    private cartService: CartService,
    private discountService: DiscountService,
    private addressService: AddressService,
    private walletService: WalletService,
    private prisma: PrismaService,
    private productService: ProductService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Membuat token JWT untuk data ringkasan order.
   * Token berlaku selama 5 menit.
   */
  async createOrderToken(orderPayload: IOrderSummaryPayload) {
    return this.jwtService.sign(orderPayload, {
      secret: this.configService.get<string>('SECRET_ORDER'),
      expiresIn: '5m',
    });
  }

  /**
   * Memverifikasi token JWT ringkasan order.
   */
  async verifyOrderToken(orderToken: string) {
    return this.jwtService.verify(orderToken, {
      secret: this.configService.get<string>('SECRET_ORDER'),
    });
  }

  /**
   * Membuat ringkasan order dari keranjang belanja atau direct buy.
   * Menghitung subtotal, diskon, pajak (12%), dan ongkir.
   */
  async orderSummary(dto: OrderSummaryDto, userId: string) {
    let isDirectBuy = false;
    let storeId: string;
    let products: IOrderProductItem[];
    let subtotal: number;

    if (dto.items && dto.items.length > 0) {
      isDirectBuy = true;
      const fetchedProducts = await Promise.all(
        dto.items.map(async (item) => {
          const product = await this.productService.findProductOrThrow(
            item.productId,
          );
          return { product, quantity: item.quantity };
        }),
      );

      storeId = fetchedProducts[0].product.storeId;
      await this.storeService.findStoreOrThrow(storeId);

      const differentStore = fetchedProducts.find(
        (fp) => fp.product.storeId !== storeId,
      );
      if (differentStore)
        throw new BadRequestException('Products must be from the same store');

      const hidden = fetchedProducts.filter((fp) => fp.product.isHidden);
      if (hidden.length > 0) {
        throw new BadRequestException(
          `Produk "${hidden[0].product.name}" telah disembunyikan oleh admin dan tidak bisa dipesan`,
        );
      }

      subtotal = fetchedProducts.reduce((total, fp) => {
        return total + fp.product.price * fp.quantity;
      }, 0);

      products = fetchedProducts.map((fp) => ({
        productId: fp.product.id,
        name: fp.product.name,
        price: fp.product.price,
        quantity: fp.quantity,
        totalItemPrice: fp.product.price * fp.quantity,
        imageUrl: fp.product.imageUrl ?? null,
      }));
    } else {
      const cart = await this.cartService.getUserCart(userId);
      if (cart.length === 0)
        throw new BadRequestException('cannot checkout an empty cart');

      storeId = cart[0].product.storeId;
      await this.storeService.findStoreOrThrow(storeId);
      subtotal = cart.reduce((total, item) => {
        return total + item.product.price * item.quantity;
      }, 0);

      const hiddenProducts = cart.filter((item) => item.product.isHidden);
      if (hiddenProducts.length > 0) {
        throw new BadRequestException(
          `Produk "${hiddenProducts[0].product.name}" telah disembunyikan oleh admin dan tidak bisa dipesan`,
        );
      }

      products = cart.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        totalItemPrice: item.product.price * item.quantity,
        imageUrl: item.product.imageUrl ?? null,
      }));
    }

    let discountValue = 0;
    let discount: Discount = null;
    if (dto.discountCode) {
      discount = await this.discountService.isDiscountAvailable(
        dto.discountCode,
      );
      if (discount.isPercent) {
        if (discount.value > 100)
          throw new BadRequestException(
            'Discount percent cannot more than 100',
          );
        discountValue = subtotal * (discount.value / 100);
      } else {
        discountValue = discount.value;
      }
      discountValue = Math.min(discountValue, subtotal);
    }
    let shippingMethod: ShippingMethod = 'REGULAR';
    if (dto.shippingMethod) {
      shippingMethod = dto.shippingMethod;
    }
    const shippingFee =
      SHIPPING_LIST.find((s) => s.id === shippingMethod)?.price ?? 0;
    const taxableAmount = Math.max(0, subtotal - discountValue);
    const taxFee = Math.round(taxableAmount * 0.12);
    const totalPrice =
      Math.max(0, subtotal - discountValue) + shippingFee + taxFee;

    const orderPayload: IOrderSummaryPayload = {
      userId,
      storeId,
      discountId: discount?.id ?? null,
      shippingMethods: SHIPPING_LIST,
      shippingSelect: shippingMethod,
      products,
      subtotal,
      discountValue,
      shippingFee,
      taxFee,
      totalPrice,
      isDirectBuy,
    };

    const orderToken = await this.createOrderToken(orderPayload);

    return {
      order: orderPayload,
      orderToken,
    };
  }

  private processedTokens = new Map<string, number>();
  private readonly TOKEN_TTL_MS = 10 * 60 * 1000;

  private isTokenProcessed(token: string): boolean {
    this.cleanupExpiredTokens();
    return this.processedTokens.has(token);
  }

  private markTokenProcessed(token: string): void {
    this.cleanupExpiredTokens();
    this.processedTokens.set(token, Date.now() + this.TOKEN_TTL_MS);
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.processedTokens) {
      if (expiresAt <= now) {
        this.processedTokens.delete(token);
      }
    }
  }

  /**
   * Memproses checkout dan membuat pesanan baru.
   * Memverifikasi token, mengurangi stok, memproses pembayaran, dan membuat pesanan.
   */
  async checkout(dto: CheckoutDto, userId: string) {
    if (this.isTokenProcessed(dto.orderToken)) {
      throw new BadRequestException('Order already processed');
    }

    let orderPayload: IOrderSummaryPayload;
    try {
      orderPayload = await this.verifyOrderToken(dto.orderToken);
    } catch {
      throw new BadRequestException('Order token not valid or expired');
    }

    const store = await this.storeService.findStoreOrThrow(
      orderPayload.storeId,
    );

    if (orderPayload.userId !== userId)
      throw new ForbiddenException('Access denied. this is not your order');

    if (orderPayload.products.length <= 0)
      throw new BadRequestException('Order products cannot be empty');

    const address = await this.addressService.isAddressMine(
      dto.addressId,
      userId,
    );

    if (orderPayload.discountId) {
      const discount = await this.discountService.findDiscountOrThrow(
        orderPayload.discountId,
      );
      await this.discountService.isDiscountAvailable(discount.code);
    }

    for (const item of orderPayload.products) {
      const product = await this.productService.findProductOrThrow(
        item.productId,
      );
      if (product.isHidden) {
        throw new BadRequestException(
          `Produk "${product.name}" telah disembunyikan oleh admin dan tidak bisa dipesan`,
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await this.walletService.verifyAndReduceBalance(
        tx,
        userId,
        orderPayload.totalPrice,
        WalletType.PAYMENT,
      );

      for (const item of orderPayload.products) {
        await this.productService.verifyAndReduceStock(
          tx,
          item.productId,
          item.quantity,
        );
      }

      const orderData = {
        buyerId: userId,
        storeId: orderPayload.storeId,
        addressLabel: address.label,
        addressSnapshot: address.completeAddress,
        storeAddress: store.address ?? '',
        discountId: orderPayload.discountId ?? null,
        shippingMethod: orderPayload.shippingSelect,
        subtotal: orderPayload.subtotal,
        discountValue: orderPayload.discountValue ?? 0,
        shippingFee: orderPayload.shippingFee,
        taxFee: orderPayload.taxFee,
        totalPrice: orderPayload.totalPrice,
      };

      const order = await this.orderRepo.createOrder(orderData, tx);

      const orderItemsData = orderPayload.products.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      await this.orderRepo.createOrderItems(orderItemsData, tx);

      if (orderPayload.discountId) {
        await this.discountService.updateDiscountUsedCount(
          tx,
          orderPayload.discountId,
        );
      }

      await this.orderRepo.createOrderStatusLog(
        order.id,
        OrderStatus.PENDING,
        tx,
      );

      if (!orderPayload.isDirectBuy) {
        await this.cartService.clearUserCart(userId, tx);
      }

      await this.addressService.markAsLastUsed(dto.addressId, userId, tx);

      return order;
    });

    this.markTokenProcessed(dto.orderToken);
    return result;
  }
}
