import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { hashing } from 'src/common/helpers/hash.helper';

jest.mock('src/common/helpers/hash.helper', () => ({
  hashing: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let repo: {
    findUserByEmail: jest.Mock;
    findUserById: jest.Mock;
    createUser: jest.Mock;
    updateLastActiveRole: jest.Mock;
  };
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock };
  let userService: {
    findUserOrThrow: jest.Mock;
    updateProfile: jest.Mock;
    changePassword: jest.Mock;
    getProfileForRole: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      createUser: jest.fn(),
      updateLastActiveRole: jest.fn(),
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('token') };
    config = { get: jest.fn().mockReturnValue('secret') };
    userService = {
      findUserOrThrow: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      getProfileForRole: jest
        .fn()
        .mockResolvedValue({ id: 'u1', username: 'test' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repo },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findUserOrThrow', () => {
    it('should return user when found', async () => {
      repo.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
      const result = await service.findUserOrThrow('a@b.com');
      expect(result.id).toBe('u1');
    });

    it('should throw UnauthorizedException when not found', async () => {
      repo.findUserByEmail.mockResolvedValue(null);
      await expect(service.findUserOrThrow('a@b.com')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('isEmailAlreadyExist', () => {
    it('should return false when email is unique', async () => {
      repo.findUserByEmail.mockResolvedValue(null);
      const result = await service.isEmailAlreadyExist('a@b.com');
      expect(result).toBe(false);
    });

    it('should throw ConflictException when email exists', async () => {
      repo.findUserByEmail.mockResolvedValue({ id: 'u1' });
      await expect(service.isEmailAlreadyExist('a@b.com')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should return token and user info', async () => {
      repo.findUserByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: 'hashed',
        lastActiveRole: 'BUYER',
        roles: [{ roleName: 'BUYER' }, { roleName: 'SELLER' }],
        username: 'test',
      });
      (hashing.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'a@b.com',
        password: 'pass',
      });
      expect(result.accessToken).toBe('token');
      expect(result.userRoles).toContain('BUYER');
    });

    it('should throw when password is wrong', async () => {
      repo.findUserByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: 'hashed',
        lastActiveRole: 'BUYER',
        roles: [],
        username: 'test',
      });
      (hashing.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('register', () => {
    it('should create user', async () => {
      repo.findUserByEmail.mockResolvedValue(null);
      (hashing.hash as jest.Mock).mockResolvedValue('hashed');
      repo.createUser.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

      const result = await service.register({
        email: 'a@b.com',
        username: 'test',
        password: 'pass',
      });
      expect(result.id).toBe('u1');
    });

    it('should throw ConflictException when email exists', async () => {
      repo.findUserByEmail.mockResolvedValue({ id: 'u1' });
      await expect(
        service.register({
          email: 'a@b.com',
          username: 'test',
          password: 'pass',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('switchRole', () => {
    it('should switch role and return new token', async () => {
      repo.findUserByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        roles: [{ roleName: 'BUYER' }, { roleName: 'SELLER' }],
      });
      repo.updateLastActiveRole.mockResolvedValue({});

      const result = await service.switchRole(
        { role: 'SELLER' } as any,
        'a@b.com',
      );
      expect(result.accessToken).toBe('token');
      expect(result.activeRole).toBe('SELLER');
    });

    it('should throw when role not assigned', async () => {
      repo.findUserByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        roles: [{ roleName: 'BUYER' }],
      });

      await expect(
        service.switchRole({ role: 'ADMIN' } as any, 'a@b.com'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
