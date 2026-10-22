import { AllKeysExhaustedError, KeyPool } from './key-pool.js';

class RateLimitError extends Error {
  readonly status = 429;
}

const isQuotaError = (error: unknown) => error instanceof RateLimitError;

describe('KeyPool', () => {
  let clock: number;
  const createPool = (keys: string[]) =>
    new KeyPool({ name: 'Test', keys, isQuotaError, defaultCooldownMs: 1_000, now: () => clock });

  beforeEach(() => {
    clock = 0;
  });

  it('keeps using the same key while it works', async () => {
    const pool = createPool(['a', 'b']);
    const used: string[] = [];
    await pool.run(async (key) => used.push(key));
    await pool.run(async (key) => used.push(key));
    expect(used).toEqual(['a', 'a']);
  });

  it('moves to the next key when the current one is rate-limited', async () => {
    const pool = createPool(['a', 'b', 'c']);
    const result = await pool.run(async (key) => {
      if (key === 'a') throw new RateLimitError();
      return key;
    });
    expect(result).toBe('b');
    // The next call starts from the key that worked.
    expect(await pool.run(async (key) => key)).toBe('b');
  });

  it('throws other errors immediately without trying more keys', async () => {
    const pool = createPool(['a', 'b']);
    const tried: string[] = [];
    await expect(
      pool.run(async (key) => {
        tried.push(key);
        throw new Error('bad request');
      }),
    ).rejects.toThrow('bad request');
    expect(tried).toEqual(['a']);
  });

  it('reports when every key is resting, and uses a key again after its cooldown', async () => {
    const pool = createPool(['a', 'b']);
    const alwaysLimited = async () => {
      throw new RateLimitError();
    };
    await expect(pool.run(alwaysLimited)).rejects.toBeInstanceOf(AllKeysExhaustedError);

    clock = 1_001;
    expect(await pool.run(async (key) => key)).toBe('a');
  });

  it('refuses to be created without keys', () => {
    expect(() => createPool([])).toThrow('at least one key');
  });
});
