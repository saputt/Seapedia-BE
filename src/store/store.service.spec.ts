import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from './store.service';
import { StoreRepository } from './store.repository';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('StoreService', () => {
  let service: StoreService;
  let repo: {
    findStoreByName: jest.Mock;
    findStoreByUserId: jest.Mock;
    findStoreById: jest.Mock;
    createStore: jest.Mock;
    updateStore: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findStoreByName: jest.fn(),
      findStoreByUserId: jest.fn(),
      findStoreById: jest.fn(),
      createStore: jest.fn(),
      updateStore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        { provide: StoreRepository, useValue: repo },
      ],
    }).compile();

    service = module.get(StoreService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findStoreOrThrow', () => {
    it('should return store when found', async () => {
      repo.findStoreById.mockResolvedValue({ id: 's1', storeName: 'Toko' });
      const result = await service.findStoreOrThrow('s1');
      expect(result.storeName).toBe('Toko');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findStoreById.mockResolvedValue(null);
      await expect(service.findStoreOrThrow('s1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createStore', () => {
    it('should create store when name is unique and user has no store', async () => {
      repo.findStoreByName.mockResolvedValue(null);
      repo.findStoreByUserId.mockResolvedValue(null);
      repo.createStore.mockResolvedValue({ id: 's1', storeName: 'Toko' });

      const result = await service.createStore({ storeName: 'Toko', description: 'Desc' } as any, 'u1');
      expect(result.storeName).toBe('Toko');
    });

    it('should throw ConflictException when store name exists', async () => {
      repo.findStoreByName.mockResolvedValue({ id: 's1' });
      await expect(
        service.createStore({ storeName: 'Toko', description: 'Desc' } as any, 'u1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when user already has a store', async () => {
      repo.findStoreByName.mockResolvedValue(null);
      repo.findStoreByUserId.mockResolvedValue({ id: 's1' });
      await expect(
        service.createStore({ storeName: 'Toko', description: 'Desc' } as any, 'u1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStore', () => {
    it('should update store after ownership check', async () => {
      repo.findStoreById.mockResolvedValue({ id: 's1', userId: 'u1' });
      repo.findStoreByName.mockResolvedValue(null);
      repo.updateStore.mockResolvedValue({ id: 's1', storeName: 'New' });

      const result = await service.updateStore({ storeName: 'New' } as any, 's1', 'u1');
      expect(result.storeName).toBe('New');
    });

    it('should throw ForbiddenException when not owner', async () => {
      repo.findStoreById.mockResolvedValue({ id: 's1', userId: 'u2' });
      await expect(
        service.updateStore({ storeName: 'New' } as any, 's1', 'u1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
