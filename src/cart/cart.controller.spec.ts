import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

describe('CartController', () => {
  let controller: CartController;
  let service: {
    addToCart: jest.Mock;
    getUserCart: jest.Mock;
    clearUserCart: jest.Mock;
    updateCartItem: jest.Mock;
    deleteCartItem: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      addToCart: jest.fn(),
      getUserCart: jest.fn(),
      clearUserCart: jest.fn(),
      updateCartItem: jest.fn(),
      deleteCartItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: service }],
    }).compile();

    controller = module.get(CartController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('addToCart', () => {
    it('should add to cart', async () => {
      service.addToCart.mockResolvedValue(undefined);
      const result = await controller.addToCart({ quantity: 2 }, 'p1', 'u1');
      expect(result.message).toContain('successful');
    });
  });

  describe('getUserCart', () => {
    it('should return cart items', async () => {
      service.getUserCart.mockResolvedValue([{ id: 'c1' }]);
      const result = await controller.getUserCart('u1');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('clearUserCart', () => {
    it('should clear cart', async () => {
      service.clearUserCart.mockResolvedValue(undefined);
      const result = await controller.clearUserCart('u1');
      expect(result.message).toContain('success');
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item', async () => {
      service.updateCartItem.mockResolvedValue({ id: 'c1', quantity: 5 });
      const result = await controller.updateCartItem(
        { quantity: 5 },
        'p1',
        'u1',
      );
      expect(result.message).toContain('success');
    });
  });

  describe('removeCartItem', () => {
    it('should remove cart item', async () => {
      service.deleteCartItem.mockResolvedValue(undefined);
      const result = await controller.removeCartItem('p1', 'u1');
      expect(result.message).toContain('success');
    });
  });
});
