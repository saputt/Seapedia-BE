import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: {
    login: jest.Mock;
    register: jest.Mock;
    switchRole: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      login: jest.fn(),
      register: jest.fn(),
      switchRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('should return login result', async () => {
      service.login.mockResolvedValue({ accessToken: 'token', activeRole: 'BUYER', userRoles: ['BUYER'], username: 'test' });
      const result = await controller.login({ email: 'a@b.com', password: 'pass' });
      expect(result.data.accessToken).toBe('token');
    });
  });

  describe('register', () => {
    it('should return register result', async () => {
      service.register.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
      const result = await controller.register({ email: 'a@b.com', username: 'test', password: 'pass' });
      expect(result.data.id).toBe('u1');
    });
  });

  describe('switchRole', () => {
    it('should return new token', async () => {
      service.switchRole.mockResolvedValue({ accessToken: 'newtoken', activeRole: 'SELLER' });
      const result = await controller.switchRole({ role: 'SELLER' } as any, 'a@b.com');
      expect(result.data.accessToken).toBe('newtoken');
    });
  });
});
