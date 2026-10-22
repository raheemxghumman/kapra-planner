import { withTimeout } from '../../common/utils/with-timeout.js';
import type { TryOnInput, TryOnProvider } from './tryon.types.js';

export class AllProvidersFailedError extends Error {
  constructor(readonly failures: string[]) {
    super(`All try-on providers failed: ${failures.join(' | ')}`);
    this.name = 'AllProvidersFailedError';
  }
}

/**
 * Chain of responsibility: asks each provider in turn and returns the first image produced.
 * A provider that throws or takes longer than `timeoutMs` passes the job to the next one.
 */
export async function runProviderChain(
  providers: TryOnProvider[],
  input: TryOnInput,
  timeoutMs: number,
): Promise<{ provider: string; image: Blob }> {
  const failures: string[] = [];
  for (const provider of providers) {
    try {
      const image = await withTimeout(provider.run(input), timeoutMs);
      return { provider: provider.name, image };
    } catch (error) {
      failures.push(`${provider.name}: ${(error as Error).message}`);
    }
  }
  throw new AllProvidersFailedError(failures);
}
