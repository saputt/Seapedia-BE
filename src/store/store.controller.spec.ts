import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';

describe('StoreController', () => {
  let controller: StoreController;
  let service: {
    createStore: jest.Mock;
    updateStore: jest.Mock;
    findUserStore: jest.Mock;
    findStoreOrThrow: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createStore: jest.fn(),
      updateStore: jest.fn(),
      findUserStore: jest.fn(),
      findStoreOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [{ provide: StoreService, useValue: service }],
    }).compile();

    controller = module.get(StoreController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createStore', () => {
    it('should create store', async () => {
      service.createStore.mockResolvedValue({ id: 's1', storeName: 'Toko' });
      const result = await controller.createStore(
        { storeName: 'Toko', description: 'Desc' },
        'u1',
      );
      expect(result.data!.storeName).toBe('Toko');
    });
  });

  describe('getMyStore', () => {
    it('should return current user store', async () => {
      service.findUserStore.mockResolvedValue({ id: 's1', storeName: 'Toko' });
      const result = await controller.getMyStore('u1');
      expect(result.data!.storeName).toBe('Toko');
    });
  });

  describe('getStoreById', () => {
    it('should return store by id', async () => {
      service.findStoreOrThrow.mockResolvedValue({
        id: 's1',
        storeName: 'Toko',
      });
      const result = await controller.getStoreById('s1');
      expect(result.data!.storeName).toBe('Toko');
    });
  });

  describe('updateStore', () => {
    it('should update store', async () => {
      service.updateStore.mockResolvedValue({
        id: 's1',
        storeName: 'New',
      } as any);
      const result = await controller.updateStore(
        { storeName: 'New' },
        's1',
        'u1',
      );
      expect(result.data!.storeName).toBe('New');
    });
  });
});
