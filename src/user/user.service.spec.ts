import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { hashing } from 'src/common/helpers/hash.helper';

jest.mock('src/common/helpers/hash.helper', () => ({
  hashing: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}));

describe('UserService', () => {
  let service: UserService;
  let repo: {
    findById: jest.Mock;
    updateUsername: jest.Mock;
    updatePassword: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      updateUsername: jest.fn(),
      updatePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: UserRepository, useValue: repo }],
    }).compile();

    service = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const user = {
        id: 'u1',
        username: 'test',
        email: 'test@test.com',
        password: 'hashed',
      };
      repo.findById.mockResolvedValue(user);

      const result = await service.getProfile('u1');

      expect(result).toEqual({
        id: 'u1',
        username: 'test',
        email: 'test@test.com',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getProfile('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update username', async () => {
      repo.findById.mockResolvedValue({ id: 'u1' });
      repo.updateUsername.mockResolvedValue({ id: 'u1', username: 'new' });

      const result = await service.updateProfile('u1', 'new');
      expect(result.username).toBe('new');
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.updateProfile('u1', 'new')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password when old password is correct', async () => {
      repo.findById.mockResolvedValue({ id: 'u1', password: 'oldHash' });
      (hashing.compare as jest.Mock).mockResolvedValue(true);
      (hashing.hash as jest.Mock).mockResolvedValue('newHash');
      repo.updatePassword.mockResolvedValue({ id: 'u1' });

      await service.changePassword('u1', 'old', 'new');
      expect(hashing.hash).toHaveBeenCalledWith('new');
      expect(repo.updatePassword).toHaveBeenCalledWith('u1', 'newHash');
    });

    it('should throw UnauthorizedException when old password is incorrect', async () => {
      repo.findById.mockResolvedValue({ id: 'u1', password: 'oldHash' });
      (hashing.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('u1', 'wrong', 'new'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.changePassword('u1', 'old', 'new')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
