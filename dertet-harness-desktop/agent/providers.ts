import { ProviderDef, ProviderId } from "./types";

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  openrouter: {
    id: "openrouter",
    displayName: "OpenRouter",
    apiStyle: "openai",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    editableBaseUrl: false,
    defaultModel: "openrouter/auto",
    // Curated slice of OpenRouter's live catalog (hundreds of models) — the full list loads live
    // via the model picker's "Оновити список"; this is just a broad offline fallback.
    knownModels: [
      "openrouter/auto",
      "stealth/ox-alpha",
      "openai/gpt-5.2",
      "openai/gpt-5.2-mini",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/o4-mini",
      "anthropic/claude-opus-5",
      "anthropic/claude-sonnet-5",
      "anthropic/claude-fable-5",
      "anthropic/claude-haiku-4.5",
      "google/gemini-3-pro",
      "google/gemini-3-flash",
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-4-maverick",
      "meta-llama/llama-4-scout",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-v4",
      "deepseek/deepseek-chat",
      "deepseek/deepseek-r2",
      "x-ai/grok-4",
      "x-ai/grok-4-fast",
      "qwen/qwen3-max",
      "qwen/qwen3-coder",
      "mistralai/mistral-large-2411",
      "mistralai/mistral-medium-3",
      "mistralai/codestral-2508",
      "moonshotai/kimi-k3",
      "z-ai/glm-5",
      "nvidia/nemotron-3-ultra-550b-a55b",
      "microsoft/phi-4",
      "cohere/command-a",
      "perplexity/sonar",
      "perplexity/sonar-reasoning"
    ]
  },
  anthropic: {
    id: "anthropic",
    displayName: "Anthropic (Claude)",
    apiStyle: "anthropic",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    editableBaseUrl: false,
    defaultModel: "claude-sonnet-5",
    knownModels: [
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-fable-5",
      "claude-haiku-4-5-20251001",
      "claude-opus-4-5",
      "claude-sonnet-4-5",
      "claude-3-7-sonnet-latest",
      "claude-3-5-haiku-latest"
    ]
  },
  openai: {
    id: "openai",
    displayName: "OpenAI",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.openai.com/v1",
    editableBaseUrl: false,
    defaultModel: "gpt-4o-mini",
    knownModels: [
      "gpt-5.2",
      "gpt-5.2-mini",
      "gpt-5.2-nano",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4o",
      "gpt-4o-mini",
      "o4-mini",
      "o3",
      "o3-pro"
    ]
  },
  gemini: {
    id: "gemini",
    displayName: "Google Gemini",
    apiStyle: "gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    editableBaseUrl: false,
    defaultModel: "gemini-2.0-flash",
    knownModels: [
      "gemini-3-pro",
      "gemini-3-flash",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro"
    ]
  },
  nvidia_nim: {
    id: "nvidia_nim",
    displayName: "NVIDIA NIM",
    apiStyle: "openai",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    editableBaseUrl: false,
    defaultModel: "meta/llama-3.3-70b-instruct",
    // Curated general-purpose chat/code models from NVIDIA's live catalog (build.nvidia.com).
    // The full catalog (100+ models incl. embeddings/vision/safety-guard/audio specialists)
    // loads live via the model picker's "refresh" — this list is just a sane offline fallback.
    knownModels: [
      "meta/llama-3.3-70b-instruct",
      "meta/llama-3.1-405b-instruct",
      "meta/llama-3.1-70b-instruct",
      "meta/llama-3.2-90b-vision-instruct",
      "nvidia/llama-3.1-nemotron-ultra-253b-v1",
      "nvidia/llama-3.3-nemotron-super-49b-v1.5",
      "nvidia/nemotron-3-ultra-550b-a55b",
      "nvidia/nemotron-3-super-120b-a12b",
      "nvidia/nemotron-3-nano-30b-a3b",
      "nvidia/nemotron-nano-3-30b-a3b",
      "deepseek-ai/deepseek-v4-flash-0731",
      "moonshotai/kimi-k3",
      "mistralai/mistral-large-2-instruct",
      "mistralai/mixtral-8x22b-v0.1",
      "mistralai/codestral-22b-instruct-v0.1",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "google/gemma-4-31b-it",
      "microsoft/phi-3.5-moe-instruct",
      "ibm/granite-34b-code-instruct",
      "01-ai/yi-large",
      "writer/palmyra-creative-122b",
      "databricks/dbrx-instruct",
      "deepseek-ai/deepseek-coder-6.7b-instruct"
    ]
  },
  groq: {
    id: "groq",
    displayName: "Groq",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    editableBaseUrl: false,
    defaultModel: "llama-3.3-70b-versatile",
    knownModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "llama-4-maverick-17b-128e-instruct",
      "llama-4-scout-17b-16e-instruct",
      "deepseek-r1-distill-llama-70b",
      "qwen3-32b",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
      "kimi-k2-instruct"
    ]
  },
  together: {
    id: "together",
    displayName: "Together AI",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.together.xyz/v1",
    editableBaseUrl: false,
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    knownModels: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
      "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      "deepseek-ai/DeepSeek-V4",
      "deepseek-ai/DeepSeek-R2",
      "Qwen/Qwen3-235B-A22B-fp8-tput",
      "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "moonshotai/Kimi-K3-Instruct",
      "zai-org/GLM-5"
    ]
  },
  fireworks: {
    id: "fireworks",
    displayName: "Fireworks AI",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.fireworks.ai/inference/v1",
    editableBaseUrl: false,
    defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    knownModels: [
      "accounts/fireworks/models/llama-v3p3-70b-instruct",
      "accounts/fireworks/models/llama4-maverick-instruct-basic",
      "accounts/fireworks/models/llama4-scout-instruct-basic",
      "accounts/fireworks/models/deepseek-v4",
      "accounts/fireworks/models/deepseek-r2",
      "accounts/fireworks/models/qwen3-235b-a22b",
      "accounts/fireworks/models/kimi-k3-instruct",
      "accounts/fireworks/models/mixtral-8x22b-instruct"
    ]
  },
  mistral: {
    id: "mistral",
    displayName: "Mistral AI",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    editableBaseUrl: false,
    defaultModel: "mistral-large-latest",
    knownModels: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
      "codestral-latest",
      "pixtral-large-latest",
      "magistral-medium-latest",
      "ministral-8b-latest",
      "ministral-3b-latest"
    ]
  },
  xai: {
    id: "xai",
    displayName: "xAI (Grok)",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.x.ai/v1",
    editableBaseUrl: false,
    defaultModel: "grok-4",
    knownModels: ["grok-4", "grok-4-fast", "grok-4-heavy", "grok-3", "grok-3-mini", "grok-code-fast-1"]
  },
  deepseek: {
    id: "deepseek",
    displayName: "DeepSeek",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    editableBaseUrl: false,
    defaultModel: "deepseek-chat",
    knownModels: ["deepseek-chat", "deepseek-reasoner"]
  },
  perplexity: {
    id: "perplexity",
    displayName: "Perplexity",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.perplexity.ai",
    editableBaseUrl: false,
    defaultModel: "sonar",
    knownModels: ["sonar", "sonar-pro", "sonar-reasoning", "sonar-reasoning-pro", "sonar-deep-research"]
  },
  cohere: {
    id: "cohere",
    displayName: "Cohere",
    apiStyle: "openai",
    defaultBaseUrl: "https://api.cohere.ai/compatibility/v1",
    editableBaseUrl: false,
    defaultModel: "command-a-03-2025",
    knownModels: ["command-a-03-2025", "command-r-plus-08-2024", "command-r-08-2024", "command-r7b-12-2024"]
  },
  ollama: {
    id: "ollama",
    displayName: "Ollama (локально)",
    apiStyle: "openai",
    defaultBaseUrl: "http://localhost:11434/v1",
    editableBaseUrl: true,
    defaultModel: "llama3.3",
    // Ollama doesn't need a real API key and exposes an OpenAI-compatible /v1/models endpoint that
    // the model picker's "Оновити список" already queries live — this is just an offline fallback
    // for whichever popular models the user is likely to have pulled locally.
    knownModels: [
      "llama3.3",
      "llama3.2",
      "qwen2.5-coder",
      "qwen3",
      "deepseek-r1",
      "mistral",
      "phi4",
      "gemma3",
      "codellama"
    ]
  },
  lmstudio: {
    id: "lmstudio",
    displayName: "LM Studio (локально)",
    apiStyle: "openai",
    defaultBaseUrl: "http://localhost:1234/v1",
    editableBaseUrl: true,
    defaultModel: "",
    knownModels: []
  },
  custom: {
    id: "custom",
    displayName: "Custom",
    apiStyle: "openai",
    defaultBaseUrl: "",
    editableBaseUrl: true,
    defaultModel: "",
    knownModels: []
  }
};

export function providerList(): ProviderDef[] {
  return Object.values(PROVIDERS);
}
