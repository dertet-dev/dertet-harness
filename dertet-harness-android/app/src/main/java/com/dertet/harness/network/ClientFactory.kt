package com.dertet.harness.network

import com.dertet.harness.data.settings.ApiStyle

object ClientFactory {
    private val openAi by lazy { OpenAiCompatibleClient() }
    private val anthropic by lazy { AnthropicClient() }
    private val gemini by lazy { GeminiClient() }

    fun forStyle(style: ApiStyle): ChatClient = when (style) {
        ApiStyle.OPENAI_COMPATIBLE -> openAi
        ApiStyle.ANTHROPIC -> anthropic
        ApiStyle.GEMINI -> gemini
    }
}
