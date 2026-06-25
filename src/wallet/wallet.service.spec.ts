import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletType } from '@prisma/client';

describe('WalletService', () => {
  let service: WalletService;
  let repo: {
    findWalletByUserId: jest.Mock;
    increaseBalanceAtomically: jest.Mock;
    createTransactionLog: jest.Mock;
    reduceBalanceAtomically: jest.Mock;
    getTransaction: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findWalletByUserId: jest.fn(),
      increaseBalanceAtomically: jest.fn(),
      createTransactionLog: jest.fn(),
      reduceBalanceAtomically: jest.fn(),
      getTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService, { provide: WalletRepository, useValue: repo }],
    }).compile();

    service = module.get(WalletService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('isWalletExist', () => {
    it('should return wallet when found', async () => {
      repo.findWalletByUserId.mockResolvedValue({ id: 'w1', balance: 100000 });
      const result = await service.isWalletExist('u1');
      expect(result.balance).toBe(100000);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      repo.findWalletByUserId.mockResolvedValue(null);
      await expect(service.isWalletExist('u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('increaseBalance', () => {
    it('should increase balance and create transaction log', async () => {
      repo.findWalletByUserId.mockResolvedValue({ id: 'w1', balance: 100000 });
      repo.increaseBalanceAtomically.mockResolvedValue({ id: 'w1', balance: 150000 });
      repo.createTransactionLog.mockResolvedValue({});

      const result = await service.increaseBalance(
        50000,
        'u1',
        WalletType.TOP_UP,
      );
      expect(result.balance).toBe(150000);
      expect(repo.createTransactionLog).toHaveBeenCalled();
    });
  });

  describe('verifyAndReduceBalance', () => {
    it('should reduce balance atomically', async () => {
      repo.findWalletByUserId.mockResolvedValue({ id: 'w1', balance: 100000 });
      repo.reduceBalanceAtomically.mockResolvedValue({ count: 1 });
      repo.createTransactionLog.mockResolvedValue({});

      await service.verifyAndReduceBalance(
        {} as any,
        'u1',
        50000,
        WalletType.TOP_UP,
      );
      expect(repo.reduceBalanceAtomically).toHaveBeenCalled();
    });

    it('should throw BadRequestException when balance insufficient', async () => {
      repo.findWalletByUserId.mockResolvedValue({ id: 'w1', balance: 10000 });
      repo.reduceBalanceAtomically.mockResolvedValue({ count: 0 });

      await expect(
        service.verifyAndReduceBalance(
          {} as any,
          'u1',
          50000,
          WalletType.TOP_UP,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWalletTransaction', () => {
    it('should return paginated transactions', async () => {
      repo.findWalletByUserId.mockResolvedValue({ id: 'w1', balance: 100000 });
      repo.getTransaction.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const result = await service.getWalletTransaction('u1', 1, 5);
      expect(result.total).toBe(0);
    });
  });
});
