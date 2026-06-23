import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { ProductService } from 'src/product/product.service';
import { BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let cartRepo: {
    findUserCartItems: jest.Mock;
    addToCart: jest.Mock;
    addQuantityCart: jest.Mock;
    deleteUserCart: jest.Mock;
    updateCartItemQuantity: jest.Mock;
    deleteCartItem: jest.Mock;
  };
  let productService: { findProductOrThrow: jest.Mock };

  beforeEach(async () => {
    cartRepo = {
      findUserCartItems: jest.fn(),
      addToCart: jest.fn(),
      addQuantityCart: jest.fn(),
      deleteUserCart: jest.fn(),
      updateCartItemQuantity: jest.fn(),
      deleteCartItem: jest.fn(),
    };
    productService = { findProductOrThrow: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CartRepository, useValue: cartRepo },
        { provide: ProductService, useValue: productService },
      ],
    }).compile();

    service = module.get(CartService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('addToCart', () => {
    it('should add new product to empty cart', async () => {
      productService.findProductOrThrow.mockResolvedValue({
        id: 'p1',
        storeId: 's1',
        stock: 10,
      });
      cartRepo.findUserCartItems.mockResolvedValue([]);
      cartRepo.addToCart.mockResolvedValue({ id: 'c1' });

      await service.addToCart({ quantity: 2 }, 'u1', 'p1');
      expect(cartRepo.addToCart).toHaveBeenCalledWith(2, 'p1', 'u1');
    });

    it('should increment quantity if product already in cart', async () => {
      productService.findProductOrThrow.mockResolvedValue({
        id: 'p1',
        storeId: 's1',
        stock: 10,
      });
      cartRepo.findUserCartItems.mockResolvedValue([
        { id: 'c1', productId: 'p1', quantity: 2, product: { storeId: 's1' } },
      ]);

      await service.addToCart({ quantity: 1 }, 'u1', 'p1');
      expect(cartRepo.addQuantityCart).toHaveBeenCalledWith('c1', 1);
    });

    it('should throw when cart has different store products', async () => {
      productService.findProductOrThrow.mockResolvedValue({
        id: 'p2',
        storeId: 's2',
        stock: 10,
      });
      cartRepo.findUserCartItems.mockResolvedValue([
        { id: 'c1', productId: 'p1', quantity: 1, product: { storeId: 's1' } },
      ]);

      await expect(
        service.addToCart({ quantity: 1 } as any, 'u1', 'p2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when stock insufficient', async () => {
      productService.findProductOrThrow.mockResolvedValue({
        id: 'p1',
        storeId: 's1',
        stock: 1,
      });
      cartRepo.findUserCartItems.mockResolvedValue([]);

      await expect(
        service.addToCart({ quantity: 5 } as any, 'u1', 'p1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserCart', () => {
    it('should return user cart items', async () => {
      cartRepo.findUserCartItems.mockResolvedValue([{ id: 'c1' }]);
      const result = await service.getUserCart('u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('clearUserCart', () => {
    it('should clear user cart', async () => {
      cartRepo.deleteUserCart.mockResolvedValue({ count: 3 });
      await service.clearUserCart('u1');
      expect(cartRepo.deleteUserCart).toHaveBeenCalled();
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      productService.findProductOrThrow.mockResolvedValue({
        id: 'p1',
        stock: 10,
      });
      cartRepo.findUserCartItems.mockResolvedValue([
        { id: 'c1', productId: 'p1', quantity: 1 },
      ]);
      cartRepo.updateCartItemQuantity.mockResolvedValue({
        id: 'c1',
        quantity: 5,
      });

      const result = await service.updateCartItem('p1', 'u1', 5);
      expect(result.quantity).toBe(5);
    });

    it('should throw when cart item not found', async () => {
      productService.findProductOrThrow.mockResolvedValue({
        id: 'p1',
        stock: 10,
      });
      cartRepo.findUserCartItems.mockResolvedValue([]);

      await expect(service.updateCartItem('p1', 'u1', 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when stock insufficient', async () => {
      productService.findProductOrThrow.mockResolvedValue({
        id: 'p1',
        stock: 2,
      });
      cartRepo.findUserCartItems.mockResolvedValue([
        { id: 'c1', productId: 'p1', quantity: 1 },
      ]);

      await expect(service.updateCartItem('p1', 'u1', 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteCartItem', () => {
    it('should delete cart item', async () => {
      cartRepo.findUserCartItems.mockResolvedValue([
        { id: 'c1', productId: 'p1' },
      ]);
      cartRepo.deleteCartItem.mockResolvedValue({});

      await service.deleteCartItem('p1', 'u1');
      expect(cartRepo.deleteCartItem).toHaveBeenCalledWith('c1');
    });

    it('should throw when cart item not found', async () => {
      cartRepo.findUserCartItems.mockResolvedValue([]);
      await expect(service.deleteCartItem('p1', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
