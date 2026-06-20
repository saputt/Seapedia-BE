import { Test, TestingModule } from '@nestjs/testing';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';

describe('DiscountController', () => {
  let controller: DiscountController;
  let service: {
    getDiscountForBuyer: jest.Mock;
    getAllDiscountForAdmin: jest.Mock;
    getDiscountForAdmin: jest.Mock;
    createDiscount: jest.Mock;
    updateDiscount: jest.Mock;
    deleteDiscount: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getDiscountForBuyer: jest.fn(),
      getAllDiscountForAdmin: jest.fn(),
      getDiscountForAdmin: jest.fn(),
      createDiscount: jest.fn(),
      updateDiscount: jest.fn(),
      deleteDiscount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscountController],
      providers: [{ provide: DiscountService, useValue: service }],
    }).compile();

    controller = module.get(DiscountController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDiscountForBuyer', () => {
    it('should return discount info', async () => {
      service.getDiscountForBuyer.mockResolvedValue({ id: 'd1', code: 'DISC10' });
      const result = await controller.getDiscountForBuyer('DISC10');
      expect(result.data.code).toBe('DISC10');
    });
  });

  describe('getAllDiscountsForAdmin', () => {
    it('should return all discounts', async () => {
      service.getAllDiscountForAdmin.mockResolvedValue([{ id: 'd1' }]);
      const result = await controller.getAllDiscountsForAdmin();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getDiscountForAdmin', () => {
    it('should return discount by id', async () => {
      service.getDiscountForAdmin.mockResolvedValue({ id: 'd1' });
      const result = await controller.getDiscountForAdmin('d1');
      expect(result.data.id).toBe('d1');
    });
  });

  describe('createDiscount', () => {
    it('should create discount', async () => {
      service.createDiscount.mockResolvedValue({ id: 'd1', code: 'DISC10' });
      const result = await controller.createDiscount({ code: 'DISC10' } as any);
      expect(result.data.code).toBe('DISC10');
    });
  });

  describe('updateDiscount', () => {
    it('should update discount', async () => {
      service.updateDiscount.mockResolvedValue({ id: 'd1', value: 20000 });
      const result = await controller.updateDiscount('d1', { value: 20000 } as any);
      expect(result.data.value).toBe(20000);
    });
  });

  describe('deleteDiscount', () => {
    it('should delete discount', async () => {
      service.deleteDiscount.mockResolvedValue(undefined);
      const result = await controller.deleteDiscount('d1');
      expect(result.message).toContain('success');
    });
  });
});
