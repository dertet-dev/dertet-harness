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
export type AgentMode = "default" | "plan" | "auto";
export type SessionKind = "chat" | "dertet_code";

export interface ProviderDef {
  id: ProviderId;
  displayName: string;
  apiStyle: "openai" | "anthropic" | "gemini";
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
}

export interface ChoiceQuestion {
  question: string;
  options: string[];
  allowCustom?: boolean;
  page?: number;
  totalPages?: number;
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
  notes: string[];
  updatedAt: number;
}

declare global {
  interface Window {
    dertet: {
      window: {
        minimize: () => Promise<void>;
        maximizeToggle: () => Promise<void>;
        close: () => Promise<void>;
      };
      settings: {
        get: () => Promise<Settings>;
        save: (s: Settings) => Promise<void>;
        providers: () => Promise<ProviderDef[]>;
        fetchModels: (providerId: string, baseUrl: string, apiKey: string) => Promise<string[]>;
        addApiKey: (entry: Omit<ApiKeyEntry, "id" | "createdAt">) => Promise<ApiKeyEntry>;
        updateApiKey: (id: string, patch: Partial<ApiKeyEntry>) => Promise<Settings>;
        deleteApiKey: (id: string) => Promise<Settings>;
        setActiveApiKey: (id: string) => Promise<Settings>;
      };
      memory: {
        get: () => Promise<UserMemory>;
        save: (m: UserMemory) => Promise<void>;
      };
      sessions: {
        list: () => Promise<SessionSummary[]>;
        create: (kind: SessionKind, apiKeyId: string, folderPaths: string[], title: string) => Promise<SessionSummary>;
        delete: (id: string) => Promise<void>;
        setMode: (id: string, mode: AgentMode) => Promise<void>;
        addFolder: (id: string, folder: string) => Promise<void>;
        removeFolder: (id: string, folder: string) => Promise<void>;
        rename: (id: string, title: string) => Promise<void>;
        messages: (id: string) => Promise<MessageRecord[]>;
        deleteMessagesFrom: (id: string, fromMessageId: string) => Promise<void>;
      };
      fs: {
        pickFolder: () => Promise<string | null>;
        pickFiles: () => Promise<string[] | null>;
      };
      chat: {
        send: (sessionId: string, text: string, attachments: Attachment[]) => Promise<void>;
        stop: (sessionId: string) => Promise<void>;
        approveToolCall: (toolCallId: string, approved: boolean) => Promise<void>;
        respondComputerUsePermission: (requestId: string, allow: boolean, remember: boolean) => Promise<void>;
        respondChoice: (requestId: string, answer: string) => Promise<void>;
      };
      on: {
        delta: (cb: (p: { sessionId: string; messageId: string; text: string }) => void) => () => void;
        toolCallUpdate: (cb: (p: { sessionId: string; messageId: string; toolCall: ToolCallRecord }) => void) => () => void;
        messageDone: (cb: (p: { sessionId: string; message: MessageRecord }) => void) => () => void;
        sessionIdle: (cb: (p: { sessionId: string }) => void) => () => void;
        error: (cb: (p: { sessionId: string; message: string }) => void) => () => void;
        computerUsePermissionRequest: (cb: (p: { sessionId: string; requestId: string }) => void) => () => void;
        choiceRequest: (cb: (p: { sessionId: string; requestId: string; question: ChoiceQuestion }) => void) => () => void;
        sessionUpdated: (cb: (p: { sessionId: string }) => void) => () => void;
        retry: (cb: (p: { sessionId: string; attempt: number; delayMs: number; message: string }) => void) => () => void;
        retryResolved: (cb: (p: { sessionId: string }) => void) => () => void;
      };
    };
  }
}

export const dertet = () => window.dertet;
