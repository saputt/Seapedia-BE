import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { NotFoundException } from '@nestjs/common';

describe('WalletController', () => {
  let controller: WalletController;
  let service: {
    getWallet: jest.Mock;
    increaseBalance: jest.Mock;
    getWalletTransaction: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getWallet: jest.fn(),
      increaseBalance: jest.fn(),
      getWalletTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [{ provide: WalletService, useValue: service }],
    }).compile();

    controller = module.get(WalletController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getWallet', () => {
    it('should return wallet info', async () => {
      service.getWallet.mockResolvedValue({ id: 'w1', balance: 100000 });
      const result = await controller.getWallet('u1');
      expect(result.data.balance).toBe(100000);
    });
  });

  describe('topUpWallet', () => {
    it('should top up wallet', async () => {
      service.increaseBalance.mockResolvedValue({ id: 'w1', balance: 150000 });
      const result = await controller.topUpWallet('u1', { amount: 50000 });
      expect(result.data.balance).toBe(150000);
    });
  });

  describe('getWalletTransaction', () => {
    it('should return transactions', async () => {
      service.getWalletTransaction.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
      const result = await controller.getWalletTransaction('u1', 'BUYER', 1, 5);
      expect(result.data.total).toBe(0);
    });
  });
});
