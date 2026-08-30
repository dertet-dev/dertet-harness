import { ApiStyle } from "../types";
import { LlmClient } from "./types";
import { openAiCompatibleClient } from "./openaiCompatible";
import { anthropicClient } from "./anthropic";
import { geminiClient } from "./gemini";

export function clientForStyle(style: ApiStyle): LlmClient {
  switch (style) {
    case "openai":
      return openAiCompatibleClient;
    case "anthropic":
      return anthropicClient;
    case "gemini":
      return geminiClient;
  }
}

export * from "./types";
