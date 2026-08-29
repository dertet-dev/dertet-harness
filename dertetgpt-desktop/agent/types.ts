export type ProviderId =
  | "openrouter"
  | "anthropic"
  | "openai"
  | "gemini"
  | "nvidia_nim"
  | "groq"
  | "together"
  | "fireworks"
  | "mistral"
  | "xai"
  | "deepseek"
  | "perplexity"
  | "cohere"
  | "custom";
export type ApiStyle = "openai" | "anthropic" | "gemini";
export type AgentMode = "default" | "plan" | "auto";
export type SessionKind = "chat" | "dertet_code";

export interface ProviderDef {
  id: ProviderId;
  displayName: string;
  apiStyle: ApiStyle;
  defaultBaseUrl: string;
  editableBaseUrl: boolean;
  defaultModel: string;
  knownModels: string[];
}

export interface ApiKeyEntry {
  id: string;
  providerId: ProviderId;
  label: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  createdAt: number;
}

export interface Settings {
  apiKeys: ApiKeyEntry[];
  activeApiKeyId: string | null;
  systemPrompt: string;
  personalizationEnabled: boolean;
  computerUseAllowed: "ask" | "always" | "never";
}

export interface Attachment {
  fileName: string;
  mimeType: string;
  kind: "image" | "file";
  base64Data?: string;
  textContent?: string;
}

export interface SessionSummary {
  id: string;
  kind: SessionKind;
  title: string;
  createdAt: number;
  updatedAt: number;
  apiKeyId: string;
  folderPaths: string[];
  mode: AgentMode;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface DertetCodeStreak {
  lastActiveDate: string; // YYYY-MM-DD, local
  streakDays: number;
}

export interface ToolCallRecord {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  resultSummary?: string;
  diff?: { path: string; before: string; after: string };
  status: "pending_approval" | "denied" | "running" | "done" | "error" | "timeout";
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface MessageRecord {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  toolCalls?: ToolCallRecord[];
  isError?: boolean;
  createdAt: number;
}

export interface UserMemory {
  enabled: boolean;
  notes: string[]; // short factual bullets about the user (not actions/tasks)
  updatedAt: number;
}

export interface AgentLessons {
  lessons: string[]; // short root-caused mistakes to avoid repeating, newest last
  updatedAt: number;
}

export interface ChoiceQuestion {
  question: string;
  options: string[];
  allowCustom?: boolean;
  page?: number;
  totalPages?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; items?: { type: string } }>;
    required: string[];
  };
  requiresApproval: boolean;
  isComputerUse?: boolean;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolExecutionResult {
  ok: boolean;
  output: string;
  diff?: { path: string; before: string; after: string };
  imageBase64?: string;
  imageMimeType?: string;
}
