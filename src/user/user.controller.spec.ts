import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { StorageService } from 'src/storage/storage.service';

describe('UserController', () => {
  let controller: UserController;
  let service: {
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
    changePassword: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: service },
        { provide: StorageService, useValue: { upload: jest.fn(), delete: jest.fn() } },
      ],
    }).compile();

    controller = module.get(UserController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('should return profile', async () => {
      service.getProfile.mockResolvedValue({ id: 'u1', username: 'test' });
      const result = await controller.getProfile('u1');
      expect(result.data.username).toBe('test');
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      service.updateProfile.mockResolvedValue({ id: 'u1', username: 'new' });
      const result = await controller.updateProfile('u1', { username: 'new' });
      expect(result.data.username).toBe('new');
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      service.changePassword.mockResolvedValue({ id: 'u1' });
      const result = await controller.changePassword('u1', {
        oldPassword: 'old',
        newPassword: 'new',
      });
      expect(result.message).toContain('success');
    });
  });
});
