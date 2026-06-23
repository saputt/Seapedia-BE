import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from 'src/order/order.service';
import { WalletService } from 'src/wallet/wallet.service';
import { ProductService } from 'src/product/product.service';
import { OrderRepository } from 'src/order/order.repository';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    user: { count: jest.Mock; findMany: jest.Mock };
    store: { count: jest.Mock };
    product: { count: jest.Mock };
    order: { count: jest.Mock; groupBy: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let orderService: {
    cancelOrderOverdue: jest.Mock;
    createOrderStatusLog: jest.Mock;
  };
  let walletService: { verifyAndRollbackBalance: jest.Mock };
  let productService: { verifyAndRollbackStock: jest.Mock };
  let orderRepo: { findOverdueBySLA: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        count: jest.fn().mockResolvedValue(10),
        findMany: jest.fn().mockResolvedValue([]),
      },
      store: { count: jest.fn().mockResolvedValue(5) },
      product: { count: jest.fn().mockResolvedValue(20) },
      order: {
        count: jest.fn().mockResolvedValue(30),
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
    };
    orderService = {
      cancelOrderOverdue: jest.fn(),
      createOrderStatusLog: jest.fn(),
    };
    walletService = { verifyAndRollbackBalance: jest.fn() };
    productService = { verifyAndRollbackStock: jest.fn() };
    orderRepo = { findOverdueBySLA: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrderService, useValue: orderService },
        { provide: WalletService, useValue: walletService },
        { provide: ProductService, useValue: productService },
        { provide: OrderRepository, useValue: orderRepo },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSimulatedDate', () => {
    it('should return current date when no simulation', () => {
      const result = service.getSimulatedDate();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard stats', async () => {
      const result = await service.getDashboard();
      expect(result.stats.totalUsers).toBe(10);
      expect(result.stats.totalStores).toBe(5);
      expect(result.stats.totalProducts).toBe(20);
      expect(result.stats.totalOrders).toBe(30);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.getUsers(1, 10);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('resetSimulation', () => {
    it('should reset simulation', () => {
      const result = service.resetSimulation();
      expect(result.message).toContain('success');
    });
  });
});
