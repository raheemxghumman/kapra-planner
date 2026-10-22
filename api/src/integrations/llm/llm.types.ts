/**
 * Provider-neutral types for chat models (OpenAI-compatible format, which Groq uses).
 * Feature modules depend on LlmClient through the LLM_CLIENT token, never on Groq itself.
 */

export const LLM_CLIENT = Symbol('LLM_CLIENT');

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: ChatRole;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type ModelTier = 'smart' | 'fast';

export interface ChatRequest {
  /** "smart" for reasoning and tool use (stylist), "fast" for simple bulk work (tagging). */
  tier: ModelTier;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  /** Force a JSON object answer (no tools). */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmClient {
  chat(request: ChatRequest): Promise<ChatMessage>;
}
