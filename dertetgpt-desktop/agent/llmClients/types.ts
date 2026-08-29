import { Attachment, ToolDefinition } from "../types";

export interface LlmToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface LlmMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  attachments?: Attachment[];
  toolCalls?: LlmToolCall[];
  toolCallId?: string;
  toolName?: string;
}

export type LlmStreamEvent =
  | { type: "delta"; text: string }
  | { type: "tool_call"; call: LlmToolCall }
  | { type: "error"; message: string }
  | { type: "done" };

export interface LlmRequestOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: LlmMessage[];
  tools: ToolDefinition[];
  signal: AbortSignal;
}

export interface LlmClient {
  stream(opts: LlmRequestOptions): AsyncGenerator<LlmStreamEvent>;
}
