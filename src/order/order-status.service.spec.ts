import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatusService } from './order-status.service';
import { OrderRepository } from './order.repository';
import { StoreService } from 'src/store/store.service';
import { WalletService } from 'src/wallet/wallet.service';
import { ProductService } from 'src/product/product.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus, RoleName, WalletType } from '@prisma/client';

describe('OrderStatusService', () => {
  let service: OrderStatusService;
  let orderRepo: {
    findOrderById: jest.Mock;
    updateOrderStatus: jest.Mock;
    createOrderStatusLog: jest.Mock;
    findJobAvailable: jest.Mock;
    createDriverJob: jest.Mock;
    setDriverJobDone: jest.Mock;
  };
  let storeService: { findStoreOrThrow: jest.Mock };
  let walletService: {
    increaseBalance: jest.Mock;
    verifyAndRollbackBalance: jest.Mock;
  };
  let productService: { verifyAndRollbackStock: jest.Mock };
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    orderRepo = {
      findOrderById: jest.fn(),
      updateOrderStatus: jest.fn(),
      createOrderStatusLog: jest.fn(),
      findJobAvailable: jest.fn(),
      createDriverJob: jest.fn(),
      setDriverJobDone: jest.fn(),
    };
    storeService = { findStoreOrThrow: jest.fn() };
    walletService = {
      increaseBalance: jest.fn(),
      verifyAndRollbackBalance: jest.fn(),
    };
    productService = { verifyAndRollbackStock: jest.fn() };
    prisma = { $transaction: jest.fn((fn: any) => fn({})) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStatusService,
        { provide: OrderRepository, useValue: orderRepo },
        { provide: StoreService, useValue: storeService },
        { provide: WalletService, useValue: walletService },
        { provide: ProductService, useValue: productService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(OrderStatusService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOrderOrThrow', () => {
    it('should return order when found', async () => {
      orderRepo.findOrderById.mockResolvedValue({ id: 'o1' });
      const result = await service.findOrderOrThrow('o1');
      expect(result.id).toBe('o1');
    });

    it('should throw NotFoundException when not found', async () => {
      orderRepo.findOrderById.mockResolvedValue(null);
      await expect(service.findOrderOrThrow('o1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order and refund', async () => {
      orderRepo.findOrderById.mockResolvedValue({
        id: 'o1',
        buyerId: 'u1',
        status: OrderStatus.PENDING,
        totalPrice: 100000,
        orderItems: [{ productId: 'p1', quantity: 2 }],
      });
      orderRepo.updateOrderStatus.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.CANCELLED,
      });
      orderRepo.createOrderStatusLog.mockResolvedValue({});

      await service.cancelOrder('u1', 'o1');
      expect(productService.verifyAndRollbackStock).toHaveBeenCalled();
      expect(walletService.verifyAndRollbackBalance).toHaveBeenCalled();
    });

    it('should throw when not owner', async () => {
      orderRepo.findOrderById.mockResolvedValue({
        id: 'o1',
        buyerId: 'u2',
        status: OrderStatus.PENDING,
        totalPrice: 100000,
        orderItems: [],
      });

      await expect(service.cancelOrder('u1', 'o1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw when order not pending', async () => {
      orderRepo.findOrderById.mockResolvedValue({
        id: 'o1',
        buyerId: 'u1',
        status: OrderStatus.DELIVERED,
        totalPrice: 100000,
        orderItems: [],
      });

      await expect(service.cancelOrder('u1', 'o1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('isJobOrderAvailable', () => {
    it('should return job when available', async () => {
      orderRepo.findJobAvailable.mockResolvedValue({ id: 'o1' });
      const result = await service.isJobOrderAvailable('o1');
      expect(result.id).toBe('o1');
    });

    it('should throw when job not available', async () => {
      orderRepo.findJobAvailable.mockResolvedValue(null);
      await expect(service.isJobOrderAvailable('o1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deliveryDone', () => {
    it('should mark delivery as done', async () => {
      orderRepo.findOrderById.mockResolvedValue({
        id: 'o1',
        storeId: 's1',
        subtotal: 100000,
        discountValue: 0,
        shippingFee: 10000,
        status: OrderStatus.ON_DELIVERY,
        driverJob: { driverId: 'd1' },
      });
      storeService.findStoreOrThrow.mockResolvedValue({
        id: 's1',
        userId: 'seller1',
      });
      orderRepo.setDriverJobDone.mockResolvedValue({});
      walletService.increaseBalance.mockResolvedValue({});

      await service.deliveryDone('o1', 'd1');
      expect(orderRepo.setDriverJobDone).toHaveBeenCalledWith('o1');
      expect(walletService.increaseBalance).toHaveBeenCalledTimes(2);
    });

    it('should throw when not the driver', async () => {
      orderRepo.findOrderById.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.ON_DELIVERY,
        driverJob: { driverId: 'd2' },
      });

      await expect(service.deliveryDone('o1', 'd1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
