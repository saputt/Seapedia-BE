import { Test, TestingModule } from '@nestjs/testing';
import { OrderQueryService } from './order-query.service';
import { OrderRepository } from './order.repository';
import { StoreService } from 'src/store/store.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrderQueryService', () => {
  let service: OrderQueryService;
  let orderRepo: {
    findOrderById: jest.Mock;
    findOrdersByUserId: jest.Mock;
    findAllOrdersForAdmin: jest.Mock;
    getOverdueOrders: jest.Mock;
    findAvailableJobs: jest.Mock;
    findOrdersByDriverId: jest.Mock;
    getOrdersSeller: jest.Mock;
  };
  let storeService: { findUserStore: jest.Mock };

  beforeEach(async () => {
    orderRepo = {
      findOrderById: jest.fn(),
      findOrdersByUserId: jest.fn(),
      findAllOrdersForAdmin: jest.fn(),
      getOverdueOrders: jest.fn(),
      findAvailableJobs: jest.fn(),
      findOrdersByDriverId: jest.fn(),
      getOrdersSeller: jest.fn(),
    };
    storeService = { findUserStore: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderQueryService,
        { provide: OrderRepository, useValue: orderRepo },
        { provide: StoreService, useValue: storeService },
      ],
    }).compile();

    service = module.get(OrderQueryService);
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

  describe('getOrderById', () => {
    it('should return order with ownership check', async () => {
      orderRepo.findOrderById.mockResolvedValue({ id: 'o1', buyerId: 'u1' });
      const result = await service.getOrderById('o1', 'u1');
      expect(result.id).toBe('o1');
    });

    it('should throw ForbiddenException when not owner', async () => {
      orderRepo.findOrderById.mockResolvedValue({ id: 'o1', buyerId: 'u2' });
      await expect(service.getOrderById('o1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getAllOrders', () => {
    it('should return buyer orders', async () => {
      orderRepo.findOrdersByUserId.mockResolvedValue([{ id: 'o1' }]);
      const result = await service.getAllOrders('u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAllOrdersForAdmin', () => {
    it('should return paginated orders', async () => {
      orderRepo.findAllOrdersForAdmin.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
      const result = await service.getAllOrdersForAdmin(1, 10);
      expect(result.total).toBe(0);
    });
  });

  describe('getAvailableJobs', () => {
    it('should return available delivery jobs', async () => {
      orderRepo.findAvailableJobs.mockResolvedValue([{ id: 'o1' }]);
      const result = await service.getAvailableJobs();
      expect(result).toHaveLength(1);
    });
  });

  describe('getMyJobs', () => {
    it('should return driver jobs', async () => {
      orderRepo.findOrdersByDriverId.mockResolvedValue([{ id: 'o1' }]);
      const result = await service.getMyJobs('u1');
      expect(result).toHaveLength(1);
    });
  });
});
