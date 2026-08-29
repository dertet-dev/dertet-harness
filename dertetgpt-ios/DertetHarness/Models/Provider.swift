import Foundation

enum ApiStyle: String, Codable {
    case openAICompatible
    case anthropic
    case gemini
}

enum ProviderType: String, CaseIterable, Identifiable, Codable {
    case openrouter
    case anthropic
    case openai
    case gemini
    case nvidiaNim
    case custom

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .openrouter: return "OpenRouter"
        case .anthropic: return "Anthropic (Claude)"
        case .openai: return "OpenAI"
        case .gemini: return "Google Gemini"
        case .nvidiaNim: return "NVIDIA NIM"
        case .custom: return "Custom"
        }
    }

    var apiStyle: ApiStyle {
        switch self {
        case .openrouter, .openai, .nvidiaNim, .custom: return .openAICompatible
        case .anthropic: return .anthropic
        case .gemini: return .gemini
        }
    }

    var defaultBaseUrl: String {
        switch self {
        case .openrouter: return "https://openrouter.ai/api/v1"
        case .anthropic: return "https://api.anthropic.com/v1"
        case .openai: return "https://api.openai.com/v1"
        case .gemini: return "https://generativelanguage.googleapis.com/v1beta"
        case .nvidiaNim: return "https://integrate.api.nvidia.com/v1"
        case .custom: return ""
        }
    }

    var defaultModel: String {
        switch self {
        case .openrouter: return "openrouter/auto"
        case .anthropic: return "claude-sonnet-5"
        case .openai: return "gpt-4o-mini"
        case .gemini: return "gemini-2.0-flash"
        case .nvidiaNim: return "meta/llama-3.1-70b-instruct"
        case .custom: return ""
        }
    }

    var knownModels: [String] {
        switch self {
        case .openrouter:
            return [
                "openrouter/auto",
                "stealth/ox-alpha",
                "openai/gpt-4o-mini",
                "openai/gpt-4o",
                "anthropic/claude-sonnet-4-5",
                "google/gemini-2.0-flash-001",
                "meta-llama/llama-3.3-70b-instruct",
                "deepseek/deepseek-chat",
                "x-ai/grok-4",
                "qwen/qwen3-max",
                "mistralai/mistral-large-2411"
            ]
        case .anthropic:
            return ["claude-sonnet-5", "claude-opus-5", "claude-fable-5", "claude-haiku-4-5-20251001"]
        case .openai:
            return ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "o4-mini"]
        case .gemini:
            return ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"]
        case .nvidiaNim:
            return [
                "meta/llama-3.1-70b-instruct",
                "meta/llama-3.1-405b-instruct",
                "nvidia/llama-3.1-nemotron-70b-instruct",
                "mistralai/mixtral-8x22b-instruct-v0.1"
            ]
        case .custom:
            return []
        }
    }

    var editableBaseUrl: Bool { self == .custom }
}

enum AppLanguage: String, CaseIterable, Identifiable {
    case system, uk, en, ru, pt, pl, kk, ro, de, fr

    var id: String { rawValue }

    /// nil means "follow system language"
    var languageCode: String? { self == .system ? nil : rawValue }

    var nativeName: String {
        switch self {
        case .system: return "" // resolved via localized string at call site
        case .uk: return "Українська"
        case .en: return "English"
        case .ru: return "Русский"
        case .pt: return "Português"
        case .pl: return "Polski"
        case .kk: return "Қазақша"
        case .ro: return "Română"
        case .de: return "Deutsch"
        case .fr: return "Français"
        }
    }
}
