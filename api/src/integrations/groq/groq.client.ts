import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { AllKeysExhaustedError, KeyPool } from '../key-pool/key-pool.js';
import type { ChatMessage, ChatRequest, LlmClient, ModelTier } from '../llm/llm.types.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Groq retired Llama 3.3; gpt-oss models support tool calling (see docs/spikes.md). */
const MODELS: Record<ModelTier, string> = {
  smart: 'openai/gpt-oss-120b',
  fast: 'openai/gpt-oss-20b',
};

const REQUEST_TIMEOUT_MS = 45_000;

class GroqHttpError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterSeconds: number | undefined,
    body: string,
  ) {
    super(`Groq answered ${status}: ${body.slice(0, 300)}`);
  }
}

/** Calls Groq's OpenAI-compatible chat API, rotating keys when one hits its rate limit. */
@Injectable()
export class GroqClient implements LlmClient {
  private readonly logger = new Logger(GroqClient.name);
  private readonly keys: KeyPool;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.keys = new KeyPool({
      name: 'Groq',
      keys: config.get('GROQ_API_KEYS', { infer: true }),
      isQuotaError: (error) => error instanceof GroqHttpError && error.status === 429,
      retryAfterMs: (error) =>
        error instanceof GroqHttpError && error.retryAfterSeconds
          ? error.retryAfterSeconds * 1000
          : undefined,
    });
  }

  async chat(request: ChatRequest): Promise<ChatMessage> {
    const body = {
      model: MODELS[request.tier],
      messages: request.messages,
      tools: request.tools,
      response_format: request.json ? { type: 'json_object' } : undefined,
      temperature: request.temperature ?? 0.3,
      max_completion_tokens: request.maxTokens ?? 2_000,
    };

    try {
      return await this.keys.run(async (apiKey) => {
        const response = await fetch(GROQ_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
          const retryAfter = Number(response.headers.get('retry-after'));
          throw new GroqHttpError(
            response.status,
            Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
            await response.text(),
          );
        }
        const data = (await response.json()) as { choices: { message: ChatMessage }[] };
        return data.choices[0].message;
      });
    } catch (error) {
      if (error instanceof AllKeysExhaustedError) {
        this.logger.warn(error.message);
        throw new ServiceUnavailableException(
          'The AI service is busy right now. Please try again in a minute.',
        );
      }
      throw error;
    }
  }
}
