import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: {
    getDashboard: jest.Mock;
    getUsers: jest.Mock;
    getSimulatedDate: jest.Mock;
    simulateOverdue: jest.Mock;
    resetSimulation: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getDashboard: jest
        .fn()
        .mockResolvedValue({ stats: {}, ordersByStatus: {}, recentOrders: [] }),
      getUsers: jest
        .fn()
        .mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 0 }),
      getSimulatedDate: jest.fn().mockReturnValue(new Date()),
      simulateOverdue: jest.fn().mockResolvedValue({}),
      resetSimulation: jest.fn().mockReturnValue({ message: 'reset success' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: service }],
    }).compile();

    controller = module.get(AdminController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDashboard', () => {
    it('should return dashboard', async () => {
      const result = await controller.getDashboard();
      expect(result.message).toContain('success');
    });
  });

  describe('getUsers', () => {
    it('should return users with bounds checking', async () => {
      const result = await controller.getUsers(1, 10);
      expect(result.data).toBeDefined();
    });
  });

  describe('getSimulationStatus', () => {
    it('should return simulation status', () => {
      const result = controller.getSimulationStatus();
      expect(result.message).toContain('success');
    });
  });

  describe('simulateOverdue', () => {
    it('should run simulation', async () => {
      const result = await controller.simulateOverdue(1);
      expect(result.message).toContain('success');
    });
  });

  describe('resetSimulation', () => {
    it('should reset simulation', () => {
      const result = controller.resetSimulation();
      expect(result.message).toContain('success');
    });
  });
});
