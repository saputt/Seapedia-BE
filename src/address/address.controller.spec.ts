import { Test, TestingModule } from '@nestjs/testing';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';

describe('AddressController', () => {
  let controller: AddressController;
  let service: {
    getAddresses: jest.Mock;
    createAddress: jest.Mock;
    updateAddress: jest.Mock;
    deleteAddress: jest.Mock;
    isAddressMine: jest.Mock;
    markAsLastUsed: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getAddresses: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      isAddressMine: jest.fn(),
      markAsLastUsed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [{ provide: AddressService, useValue: service }],
    }).compile();

    controller = module.get(AddressController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getAddresses', () => {
    it('should return user addresses', async () => {
      service.getAddresses.mockResolvedValue([{ id: 'a1' }]);
      const result = await controller.getAddresses('u1');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createAddress', () => {
    it('should create address', async () => {
      service.createAddress.mockResolvedValue({ id: 'a1', label: 'Home' });
      const result = await controller.createAddress(
        { label: 'Home', completeAddress: 'St. 1' },
        'u1',
      );
      expect(result.data.label).toBe('Home');
    });
  });

  describe('getAddress', () => {
    it('should return address after ownership check', async () => {
      service.isAddressMine.mockResolvedValue({ id: 'a1', label: 'Home' });
      const result = await controller.getAddress('a1', 'u1');
      expect(result.data.id).toBe('a1');
    });
  });

  describe('updateAddress', () => {
    it('should update address', async () => {
      service.updateAddress.mockResolvedValue({ id: 'a1', label: 'Office' });
      const result = await controller.updateAddress(
        'a1',
        { label: 'Office' },
        'u1',
      );
      expect(result.data.label).toBe('Office');
    });
  });

  describe('deleteAddress', () => {
    it('should delete address', async () => {
      service.deleteAddress.mockResolvedValue(undefined);
      const result = await controller.deleteAddress('a1', 'u1');
      expect(result.message).toContain('success');
    });
  });
});
