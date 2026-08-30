package com.dertet.harness.network

import com.dertet.harness.data.settings.ApiStyle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.Request

suspend fun fetchAvailableModels(style: ApiStyle, baseUrl: String, apiKey: String): List<String> =
    withContext(Dispatchers.IO) {
        try {
            when (style) {
                ApiStyle.OPENAI_COMPATIBLE -> fetchOpenAiStyleModels(baseUrl, apiKey)
                ApiStyle.ANTHROPIC -> fetchAnthropicModels(baseUrl, apiKey)
                ApiStyle.GEMINI -> fetchGeminiModels(baseUrl, apiKey)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

private fun fetchOpenAiStyleModels(baseUrl: String, apiKey: String): List<String> {
    if (baseUrl.isBlank()) return emptyList()
    val requestBuilder = Request.Builder().url(baseUrl.trimEnd('/') + "/models")
    if (apiKey.isNotBlank()) requestBuilder.addHeader("Authorization", "Bearer $apiKey")
    sharedHttpClient.newCall(requestBuilder.build()).execute().use { resp ->
        if (!resp.isSuccessful) return emptyList()
        val body = resp.body?.string() ?: return emptyList()
        val arr = Json.parseToJsonElement(body).jsonObject["data"]?.jsonArray ?: return emptyList()
        return arr.mapNotNull { it.jsonObject["id"]?.jsonPrimitive?.contentOrNull }.sorted()
    }
}

private fun fetchAnthropicModels(baseUrl: String, apiKey: String): List<String> {
    if (apiKey.isBlank()) return emptyList()
    val request = Request.Builder()
        .url(baseUrl.trimEnd('/') + "/models?limit=1000")
        .addHeader("x-api-key", apiKey)
        .addHeader("anthropic-version", "2023-06-01")
        .build()
    sharedHttpClient.newCall(request).execute().use { resp ->
        if (!resp.isSuccessful) return emptyList()
        val body = resp.body?.string() ?: return emptyList()
        val arr = Json.parseToJsonElement(body).jsonObject["data"]?.jsonArray ?: return emptyList()
        return arr.mapNotNull { it.jsonObject["id"]?.jsonPrimitive?.contentOrNull }.sorted()
    }
}

private fun fetchGeminiModels(baseUrl: String, apiKey: String): List<String> {
    if (apiKey.isBlank()) return emptyList()
    val request = Request.Builder()
        .url(baseUrl.trimEnd('/') + "/models?pageSize=1000")
        .addHeader("x-goog-api-key", apiKey)
        .build()
    sharedHttpClient.newCall(request).execute().use { resp ->
        if (!resp.isSuccessful) return emptyList()
        val body = resp.body?.string() ?: return emptyList()
        val arr = Json.parseToJsonElement(body).jsonObject["models"]?.jsonArray ?: return emptyList()
        return arr.mapNotNull { m ->
            val name = m.jsonObject["name"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
            val methods = m.jsonObject["supportedGenerationMethods"]?.jsonArray
            val supportsChat = methods == null || methods.any {
                it.jsonPrimitive.contentOrNull == "generateContent" || it.jsonPrimitive.contentOrNull == "streamGenerateContent"
            }
            if (!supportsChat) return@mapNotNull null
            name.removePrefix("models/")
        }.sorted()
    }
}
