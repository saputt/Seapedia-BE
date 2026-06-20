import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { AddressRepository } from './address.repository';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AddressService', () => {
  let service: AddressService;
  let repo: {
    findAddressById: jest.Mock;
    findAddressesUser: jest.Mock;
    createAddress: jest.Mock;
    updateAddress: jest.Mock;
    deleteAddress: jest.Mock;
    markAsLastUsed: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findAddressById: jest.fn(),
      findAddressesUser: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      markAsLastUsed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        { provide: AddressRepository, useValue: repo },
      ],
    }).compile();

    service = module.get(AddressService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('isAddressMine', () => {
    it('should return address when ownership is valid', async () => {
      repo.findAddressById.mockResolvedValue({ id: 'a1', userId: 'u1' });
      const result = await service.isAddressMine('a1', 'u1');
      expect(result.id).toBe('a1');
    });

    it('should throw NotFoundException when address not found', async () => {
      repo.findAddressById.mockResolvedValue(null);
      await expect(service.isAddressMine('a1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not owner', async () => {
      repo.findAddressById.mockResolvedValue({ id: 'a1', userId: 'u2' });
      await expect(service.isAddressMine('a1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAddresses', () => {
    it('should return user addresses', async () => {
      repo.findAddressesUser.mockResolvedValue([{ id: 'a1' }]);
      const result = await service.getAddresses('u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('createAddress', () => {
    it('should create address', async () => {
      repo.createAddress.mockResolvedValue({ id: 'a1', label: 'Home' });
      const result = await service.createAddress({ label: 'Home', completeAddress: 'St. 1' } as any, 'u1');
      expect(result.label).toBe('Home');
    });
  });

  describe('updateAddress', () => {
    it('should update address after ownership check', async () => {
      repo.findAddressById.mockResolvedValue({ id: 'a1', userId: 'u1' });
      repo.updateAddress.mockResolvedValue({ id: 'a1', label: 'Office' });
      const result = await service.updateAddress({ label: 'Office' } as any, 'a1', 'u1');
      expect(result.label).toBe('Office');
    });
  });

  describe('deleteAddress', () => {
    it('should delete address after ownership check', async () => {
      repo.findAddressById.mockResolvedValue({ id: 'a1', userId: 'u1' });
      repo.deleteAddress.mockResolvedValue({ id: 'a1' });
      await service.deleteAddress('a1', 'u1');
      expect(repo.deleteAddress).toHaveBeenCalledWith('a1');
    });
  });
});
