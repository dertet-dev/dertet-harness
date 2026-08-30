package com.dertet.harness.network

import com.dertet.harness.data.AttachmentKind
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class AnthropicClient : ChatClient {

    override fun streamChat(
        baseUrl: String,
        apiKey: String,
        model: String,
        systemPrompt: String,
        history: List<ChatMessage>
    ): Flow<ChatStreamEvent> = flow {
        val messages = buildJsonArray {
            for (msg in history) {
                add(buildJsonObject {
                    put("role", msg.role)
                    put("content", buildContent(msg))
                })
            }
        }

        val bodyBuilder = buildJsonObject {
            put("model", model)
            put("max_tokens", 8192)
            put("stream", true)
            if (systemPrompt.isNotBlank()) put("system", systemPrompt)
            put("messages", messages)
        }
        val body = bodyBuilder.toString().toRequestBody("application/json".toMediaType())

        val url = baseUrl.trimEnd('/') + "/messages"
        val request = Request.Builder()
            .url(url)
            .addHeader("x-api-key", apiKey)
            .addHeader("anthropic-version", "2023-06-01")
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build()

        var gotAny = false
        try {
            sseFlow(sharedHttpClient, request).collect { event ->
                val type = event.type
                val data = event.data.trim()
                if (data.isEmpty()) return@collect
                try {
                    when (type) {
                        "content_block_delta" -> {
                            val json = Json.parseToJsonElement(data).jsonObject
                            val delta = json["delta"]?.jsonObject
                            val text = delta?.get("text")?.jsonPrimitive?.contentOrNull
                            if (!text.isNullOrEmpty()) {
                                gotAny = true
                                emit(ChatStreamEvent.Delta(text))
                            }
                        }
                        "error" -> {
                            val json = Json.parseToJsonElement(data).jsonObject
                            val msg = json["error"]?.jsonObject?.get("message")?.jsonPrimitive?.contentOrNull
                                ?: "API error"
                            emit(ChatStreamEvent.Error(msg))
                        }
                        else -> {
                            // message_start, content_block_start/stop, message_delta, message_stop, ping - ignored
                        }
                    }
                } catch (e: Exception) {
                    // ignore malformed chunk
                }
            }
            emit(ChatStreamEvent.Done)
        } catch (e: Exception) {
            if (!gotAny) emit(ChatStreamEvent.Error(e.message ?: "Помилка з’єднання"))
            else emit(ChatStreamEvent.Done)
        }
    }

    private fun buildContent(msg: ChatMessage): kotlinx.serialization.json.JsonElement {
        val images = msg.attachments.filter { it.kind == AttachmentKind.IMAGE && it.base64Data != null }
        val files = msg.attachments.filter { it.kind == AttachmentKind.FILE }

        var textPart = msg.text
        for (f in files) {
            if (f.textContent != null) {
                textPart = "[Файл: ${f.fileName}]\n${f.textContent}\n\n$textPart"
            }
        }

        if (images.isEmpty()) {
            return JsonPrimitive(textPart)
        }

        return buildJsonArray {
            for (img in images) {
                add(buildJsonObject {
                    put("type", "image")
                    put("source", buildJsonObject {
                        put("type", "base64")
                        put("media_type", img.mimeType)
                        put("data", img.base64Data)
                    })
                })
            }
            add(buildJsonObject {
                put("type", "text")
                put("text", textPart)
            })
        }
    }
}
