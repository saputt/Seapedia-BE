import { Test, TestingModule } from '@nestjs/testing';
import { DiscountService } from './discount.service';
import { DiscountRepository } from './discount.repository';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('DiscountService', () => {
  let service: DiscountService;
  let repo: {
    findDiscountById: jest.Mock;
    findDiscountByCode: jest.Mock;
    createDiscount: jest.Mock;
    findAllDiscountsForAdmin: jest.Mock;
    updateDiscount: jest.Mock;
    deleteDiscount: jest.Mock;
    updateDiscountUsedCount: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findDiscountById: jest.fn(),
      findDiscountByCode: jest.fn(),
      createDiscount: jest.fn(),
      findAllDiscountsForAdmin: jest.fn(),
      updateDiscount: jest.fn(),
      deleteDiscount: jest.fn(),
      updateDiscountUsedCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,
        { provide: DiscountRepository, useValue: repo },
      ],
    }).compile();

    service = module.get(DiscountService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findDiscountOrThrow', () => {
    it('should return discount when found', async () => {
      repo.findDiscountById.mockResolvedValue({ id: 'd1', code: 'DISC10' });
      const result = await service.findDiscountOrThrow('d1');
      expect(result.code).toBe('DISC10');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findDiscountById.mockResolvedValue(null);
      await expect(service.findDiscountOrThrow('d1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isDiscountAlreadyExist', () => {
    it('should return false when code is unique', async () => {
      repo.findDiscountByCode.mockResolvedValue(null);
      const result = await service.isDiscountAlreadyExist('DISC10');
      expect(result).toBe(false);
    });

    it('should throw ConflictException when code exists', async () => {
      repo.findDiscountByCode.mockResolvedValue({ id: 'd1' });
      await expect(service.isDiscountAlreadyExist('DISC10')).rejects.toThrow(ConflictException);
    });
  });

  describe('isDiscountAvailable', () => {
    it('should return discount when available', async () => {
      repo.findDiscountByCode.mockResolvedValue({
        id: 'd1',
        code: 'DISC10',
        expiredAt: new Date(Date.now() + 86400000),
        usedCount: 0,
        maxUses: 100,
      });
      const result = await service.isDiscountAvailable('DISC10');
      expect(result.code).toBe('DISC10');
    });

    it('should throw NotFoundException when code not found', async () => {
      repo.findDiscountByCode.mockResolvedValue(null);
      await expect(service.isDiscountAvailable('NONE')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when expired', async () => {
      repo.findDiscountByCode.mockResolvedValue({
        id: 'd1',
        code: 'DISC10',
        expiredAt: new Date(Date.now() - 86400000),
        usedCount: 0,
        maxUses: 100,
      });
      await expect(service.isDiscountAvailable('DISC10')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when max uses reached', async () => {
      repo.findDiscountByCode.mockResolvedValue({
        id: 'd1',
        code: 'DISC10',
        expiredAt: new Date(Date.now() + 86400000),
        usedCount: 100,
        maxUses: 100,
      });
      await expect(service.isDiscountAvailable('DISC10')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createDiscount', () => {
    it('should create discount', async () => {
      repo.findDiscountByCode.mockResolvedValue(null);
      repo.createDiscount.mockResolvedValue({ id: 'd1', code: 'DISC10' });
      const result = await service.createDiscount({
        code: 'DISC10',
        type: 'FIXED',
        value: 10000,
        isPercent: false,
        expiredAt: '2026-12-31',
      } as any);
      expect(result.code).toBe('DISC10');
    });
  });

  describe('getDiscountForBuyer', () => {
    it('should return discount info for buyer', async () => {
      repo.findDiscountByCode.mockResolvedValue({
        id: 'd1',
        code: 'DISC10',
        type: 'FIXED',
        value: 10000,
        isPercent: false,
        expiredAt: new Date(Date.now() + 86400000),
        usedCount: 0,
        maxUses: 100,
      });
      const result = await service.getDiscountForBuyer('DISC10');
      expect(result.id).toBe('d1');
      expect(result).not.toHaveProperty('expiredAt');
    });
  });
});
