import { Global, Module } from '@nestjs/common';
import { GroqClient } from '../groq/groq.client.js';
import { LLM_CLIENT } from './llm.types.js';

/**
 * Binds the LLM_CLIENT token to Groq. Global so any feature module can inject it.
 * To switch provider, bind the token to another class here; nothing else changes.
 */
@Global()
@Module({
  providers: [{ provide: LLM_CLIENT, useClass: GroqClient }],
  exports: [LLM_CLIENT],
})
export class LlmModule {}
