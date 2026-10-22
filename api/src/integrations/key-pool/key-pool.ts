import { Logger } from '@nestjs/common';

export class AllKeysExhaustedError extends Error {
  constructor(
    readonly poolName: string,
    readonly retryAt: Date,
  ) {
    super(`All ${poolName} API keys are rate-limited. Next key is free at ${retryAt.toISOString()}.`);
    this.name = 'AllKeysExhaustedError';
  }
}

export interface KeyPoolOptions {
  /** Provider name used in logs and errors, e.g. "Groq". */
  name: string;
  keys: string[];
  /** Returns true when an error means "this key hit its rate limit or quota". */
  isQuotaError: (error: unknown) => boolean;
  /** Optional: how long the provider asked us to wait (Retry-After), in milliseconds. */
  retryAfterMs?: (error: unknown) => number | undefined;
  /** How long a limited key rests when the provider does not say. Default: 60 seconds. */
  defaultCooldownMs?: number;
  /** Clock, injectable so tests can control time. */
  now?: () => number;
}

/**
 * Rotates between several API keys of the same provider.
 *
 * The pool keeps using the current key. When a call fails with a quota or rate-limit error,
 * that key rests for a cooldown and the same call is retried with the next free key.
 * Any other error (bad request, network failure) is thrown immediately, because another key
 * would not fix it. Keys are never logged, only their position (#1, #2, ...).
 */
export class KeyPool {
  private readonly logger: Logger;
  private readonly restingUntil = new Map<number, number>();
  private current = 0;

  constructor(private readonly options: KeyPoolOptions) {
    if (options.keys.length === 0) {
      throw new Error(`${options.name} key pool needs at least one key`);
    }
    this.logger = new Logger(`${options.name}KeyPool`);
  }

  get size(): number {
    return this.options.keys.length;
  }

  async run<T>(task: (apiKey: string) => Promise<T>): Promise<T> {
    const { keys, isQuotaError } = this.options;
    const start = this.current;

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const index = (start + attempt) % keys.length;
      if (this.isResting(index)) {
        continue;
      }
      try {
        const result = await task(keys[index]);
        this.current = index;
        return result;
      } catch (error) {
        if (!isQuotaError(error)) {
          throw error;
        }
        this.rest(index, error);
      }
    }

    throw new AllKeysExhaustedError(this.options.name, new Date(this.nextFreeAt()));
  }

  private isResting(index: number): boolean {
    const until = this.restingUntil.get(index);
    return until !== undefined && until > this.now();
  }

  private rest(index: number, error: unknown): void {
    const cooldown =
      this.options.retryAfterMs?.(error) ?? this.options.defaultCooldownMs ?? 60_000;
    this.restingUntil.set(index, this.now() + cooldown);
    this.logger.warn(
      `Key #${index + 1} of ${this.size} hit its limit; resting for ${Math.ceil(cooldown / 1000)}s`,
    );
  }

  private nextFreeAt(): number {
    return Math.min(...this.restingUntil.values());
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }
}
