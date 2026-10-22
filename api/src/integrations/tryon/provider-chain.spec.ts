import { AllProvidersFailedError, runProviderChain } from './provider-chain.js';
import type { TryOnInput, TryOnProvider } from './tryon.types.js';

const input: TryOnInput = {
  person: new Blob(['p']),
  garment: new Blob(['g']),
  garmentType: 'upper',
  description: 'kurta',
};
const image = new Blob(['result']);

const provider = (name: string, run: () => Promise<Blob>): TryOnProvider => ({
  name,
  run: vi.fn(run),
});

describe('runProviderChain', () => {
  it('uses the first provider when it succeeds and never calls the next', async () => {
    const second = provider('second', () => Promise.resolve(image));
    const result = await runProviderChain(
      [provider('first', () => Promise.resolve(image)), second],
      input,
      1000,
    );
    expect(result).toEqual({ provider: 'first', image });
    expect(second.run).not.toHaveBeenCalled();
  });

  it('falls back to the next provider when one fails', async () => {
    const result = await runProviderChain(
      [
        provider('busy', () => Promise.reject(new Error('GPU quota exceeded'))),
        provider('backup', () => Promise.resolve(image)),
      ],
      input,
      1000,
    );
    expect(result.provider).toBe('backup');
  });

  it('treats a provider that is too slow as failed', async () => {
    const slow = provider(
      'slow',
      () => new Promise<Blob>((resolve) => setTimeout(() => resolve(image), 200)),
    );
    const result = await runProviderChain(
      [slow, provider('fast', () => Promise.resolve(image))],
      input,
      20,
    );
    expect(result.provider).toBe('fast');
  });

  it('reports every failure when all providers fail', async () => {
    const chain = runProviderChain(
      [
        provider('a', () => Promise.reject(new Error('down'))),
        provider('b', () => Promise.reject(new Error('busy'))),
      ],
      input,
      1000,
    );
    await expect(chain).rejects.toBeInstanceOf(AllProvidersFailedError);
    await expect(chain).rejects.toThrow('a: down | b: busy');
  });
});
