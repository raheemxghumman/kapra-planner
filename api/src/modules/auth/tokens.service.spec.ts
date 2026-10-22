import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import type { RefreshToken } from './entities/refresh-token.entity.js';
import { TokensService } from './tokens.service.js';

describe('TokensService', () => {
  let repository: {
    insert: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let service: TokensService;
  const user = { id: 'user-1', role: 'customer' };

  const storedToken = (overrides: Partial<RefreshToken> = {}) => ({
    id: 'token-1',
    userId: user.id,
    user,
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      insert: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const jwtService = { signAsync: vi.fn().mockResolvedValue('signed-jwt') };
    service = new TokensService(
      jwtService as unknown as JwtService,
      repository as unknown as Repository<RefreshToken>,
    );
  });

  it('stores only a hash of the refresh token', async () => {
    const tokens = await service.issue(user as never);
    const saved = repository.insert.mock.calls[0][0];
    expect(tokens.accessToken).toBe('signed-jwt');
    expect(saved.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.tokenHash).not.toContain(tokens.refreshToken);
  });

  it('accepts a valid token once and revokes it', async () => {
    repository.findOne.mockResolvedValue(storedToken());
    await expect(service.consume('raw-token')).resolves.toEqual(user);
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown token', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.consume('raw-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    repository.findOne.mockResolvedValue(storedToken({ expiresAt: new Date(Date.now() - 1) }));
    await expect(service.consume('raw-token')).rejects.toThrow(/expired/i);
  });

  it('ends every session when a used token is presented again (reuse detection)', async () => {
    repository.findOne.mockResolvedValue(storedToken({ revokedAt: new Date() }));
    await expect(service.consume('raw-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id }),
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });

  it('treats a lost race between two refreshes as reuse', async () => {
    repository.findOne.mockResolvedValue(storedToken());
    repository.update.mockResolvedValueOnce({ affected: 0 });
    await expect(service.consume('raw-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
