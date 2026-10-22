import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import type { User } from '../users/entities/user.entity.js';
import type { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import type { TokensService } from './tokens.service.js';

const TOKENS = { accessToken: 'access', expiresIn: 900, refreshToken: 'refresh' };

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    name: 'Ayesha',
    email: 'ayesha@example.com',
    passwordHash: bcrypt.hashSync('correct-pass1', 4),
    role: UserRole.Customer,
    status: UserStatus.Active,
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  }) as User;

describe('AuthService', () => {
  let usersService: {
    create: ReturnType<typeof vi.fn>;
    findByEmailWithPassword: ReturnType<typeof vi.fn>;
    recordFailedLogin: ReturnType<typeof vi.fn>;
    recordSuccessfulLogin: ReturnType<typeof vi.fn>;
  };
  let tokensService: { issue: ReturnType<typeof vi.fn>; consume: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    usersService = {
      create: vi.fn(async (data: Partial<User>) => makeUser(data)),
      findByEmailWithPassword: vi.fn(),
      recordFailedLogin: vi.fn(),
      recordSuccessfulLogin: vi.fn(),
    };
    tokensService = { issue: vi.fn().mockResolvedValue(TOKENS), consume: vi.fn() };
    service = new AuthService(
      usersService as unknown as UsersService,
      tokensService as unknown as TokensService,
    );
  });

  describe('register', () => {
    it('creates customers as active and stores a bcrypt hash, not the password', async () => {
      const result = await service.register({
        name: 'Ayesha',
        email: 'ayesha@example.com',
        password: 'secret-pass1',
        role: UserRole.Customer,
      });
      const saved = usersService.create.mock.calls[0][0];
      expect(saved.status).toBe(UserStatus.Active);
      expect(saved.passwordHash).not.toBe('secret-pass1');
      expect(await bcrypt.compare('secret-pass1', saved.passwordHash)).toBe(true);
      expect(result.accessToken).toBe('access');
    });

    it.each([UserRole.Brand, UserRole.Tailor])('creates %s accounts as pending', async (role) => {
      await service.register({ name: 'Shop', email: 's@example.com', password: 'secret-pass1', role });
      expect(usersService.create.mock.calls[0][0].status).toBe(UserStatus.Pending);
    });
  });

  describe('login', () => {
    it('returns tokens and resets failed attempts for the right password', async () => {
      const user = makeUser();
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      const result = await service.login({ email: user.email, password: 'correct-pass1' });
      expect(result.refreshToken).toBe('refresh');
      expect(usersService.recordSuccessfulLogin).toHaveBeenCalledWith(user);
    });

    it('gives the same error for an unknown email and a wrong password', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);
      const unknownEmail = service.login({ email: 'nobody@example.com', password: 'x' });
      await expect(unknownEmail).rejects.toThrow('Invalid email or password');

      usersService.findByEmailWithPassword.mockResolvedValue(makeUser());
      const wrongPassword = service.login({ email: 'ayesha@example.com', password: 'wrong-pass1' });
      await expect(wrongPassword).rejects.toThrow('Invalid email or password');
    });

    it('records a failed attempt for a wrong password', async () => {
      const user = makeUser();
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      await expect(service.login({ email: user.email, password: 'wrong-pass1' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(usersService.recordFailedLogin).toHaveBeenCalledWith(user, 5, 15);
    });

    it('refuses a locked account even with the right password', async () => {
      const user = makeUser({ lockedUntil: new Date(Date.now() + 10 * 60_000) });
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      await expect(service.login({ email: user.email, password: 'correct-pass1' })).rejects.toThrow(
        /try again in 10 minutes/i,
      );
      expect(tokensService.issue).not.toHaveBeenCalled();
    });

    it('refuses a suspended account', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(makeUser({ status: UserStatus.Suspended }));
      await expect(
        service.login({ email: 'ayesha@example.com', password: 'correct-pass1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('refresh', () => {
    it('issues a new pair for a valid refresh token', async () => {
      tokensService.consume.mockResolvedValue(makeUser());
      const result = await service.refresh('old-token');
      expect(tokensService.consume).toHaveBeenCalledWith('old-token');
      expect(result.accessToken).toBe('access');
    });

    it('refuses to refresh a suspended account', async () => {
      tokensService.consume.mockResolvedValue(makeUser({ status: UserStatus.Suspended }));
      await expect(service.refresh('token')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
