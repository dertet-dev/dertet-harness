package com.dertet.gpt.data.settings

enum class ApiStyle {
    OPENAI_COMPATIBLE,
    ANTHROPIC,
    GEMINI
}

enum class ProviderType(
    val id: String,
    val displayName: String,
    val defaultBaseUrl: String,
    val apiStyle: ApiStyle,
    val defaultModel: String,
    val knownModels: List<String>,
    val editableBaseUrl: Boolean = false
) {
    OPENROUTER(
        id = "openrouter",
        displayName = "OpenRouter",
        defaultBaseUrl = "https://openrouter.ai/api/v1",
        apiStyle = ApiStyle.OPENAI_COMPATIBLE,
        defaultModel = "openai/gpt-4o-mini",
        knownModels = listOf(
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
        )
    ),
    ANTHROPIC(
        id = "anthropic",
        displayName = "Anthropic (Claude)",
        defaultBaseUrl = "https://api.anthropic.com/v1",
        apiStyle = ApiStyle.ANTHROPIC,
        defaultModel = "claude-sonnet-5",
        knownModels = listOf(
            "claude-sonnet-5",
            "claude-opus-5",
            "claude-fable-5",
            "claude-haiku-4-5-20251001"
        )
    ),
    OPENAI(
        id = "openai",
        displayName = "OpenAI",
        defaultBaseUrl = "https://api.openai.com/v1",
        apiStyle = ApiStyle.OPENAI_COMPATIBLE,
        defaultModel = "gpt-4o-mini",
        knownModels = listOf(
            "gpt-4o-mini",
            "gpt-4o",
            "gpt-4.1",
            "o4-mini"
        )
    ),
    GEMINI(
        id = "gemini",
        displayName = "Google Gemini",
        defaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta",
        apiStyle = ApiStyle.GEMINI,
        defaultModel = "gemini-2.0-flash",
        knownModels = listOf(
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-pro"
        )
    ),
    NVIDIA_NIM(
        id = "nvidia_nim",
        displayName = "NVIDIA NIM",
        defaultBaseUrl = "https://integrate.api.nvidia.com/v1",
        apiStyle = ApiStyle.OPENAI_COMPATIBLE,
        defaultModel = "meta/llama-3.1-70b-instruct",
        knownModels = listOf(
            "meta/llama-3.1-70b-instruct",
            "meta/llama-3.1-405b-instruct",
            "nvidia/llama-3.1-nemotron-70b-instruct",
            "mistralai/mixtral-8x22b-instruct-v0.1"
        )
    ),
    CUSTOM(
        id = "custom",
        displayName = "Custom",
        defaultBaseUrl = "",
        apiStyle = ApiStyle.OPENAI_COMPATIBLE,
        defaultModel = "",
        knownModels = emptyList(),
        editableBaseUrl = true
    );

    companion object {
        fun fromId(id: String?): ProviderType = entries.find { it.id == id } ?: OPENROUTER
    }
}
