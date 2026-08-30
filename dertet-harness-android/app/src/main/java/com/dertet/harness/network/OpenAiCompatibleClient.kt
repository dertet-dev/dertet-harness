package com.dertet.harness.network

import com.dertet.harness.data.AttachmentKind
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class OpenAiCompatibleClient : ChatClient {

    override fun streamChat(
        baseUrl: String,
        apiKey: String,
        model: String,
        systemPrompt: String,
        history: List<ChatMessage>
    ): Flow<ChatStreamEvent> = flow {
        val messages = buildJsonArray {
            if (systemPrompt.isNotBlank()) {
                add(buildJsonObject {
                    put("role", "system")
                    put("content", systemPrompt)
                })
            }
            for (msg in history) {
                add(buildJsonObject {
                    put("role", msg.role)
                    put("content", buildContent(msg))
                })
            }
        }

        val body = buildJsonObject {
            put("model", model)
            put("stream", true)
            put("messages", messages)
        }.toString().toRequestBody("application/json".toMediaType())

        val url = baseUrl.trimEnd('/') + "/chat/completions"
        val requestBuilder = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("Content-Type", "application/json")
        if (baseUrl.contains("openrouter.ai")) {
            requestBuilder.addHeader("HTTP-Referer", "https://dertetgpt.app")
            requestBuilder.addHeader("X-Title", "Dertet Harness")
        }
        val request = requestBuilder.post(body).build()

        var gotAny = false
        try {
            sseFlow(sharedHttpClient, request).collect { event ->
                val data = event.data.trim()
                if (data == "[DONE]") return@collect
                if (data.isEmpty()) return@collect
                try {
                    val json = Json.parseToJsonElement(data).jsonObject
                    val errorObj = json["error"]?.jsonObject
                    if (errorObj != null) {
                        val msg = errorObj["message"]?.jsonPrimitive?.contentOrNull ?: "API error"
                        emit(ChatStreamEvent.Error(msg))
                        return@collect
                    }
                    val choices = json["choices"]?.jsonArray ?: JsonArray(emptyList())
                    val delta = choices.firstOrNull()?.jsonObject?.get("delta")?.jsonObject
                    val content = delta?.get("content")
                    val text = if (content == null || content is JsonNull) null else content.jsonPrimitive.contentOrNull
                    if (!text.isNullOrEmpty()) {
                        gotAny = true
                        emit(ChatStreamEvent.Delta(text))
                    }
                    val images = delta?.get("images")?.jsonArray
                    val imageUrl = images?.firstOrNull()?.jsonObject
                        ?.get("image_url")?.jsonObject
                        ?.get("url")?.jsonPrimitive?.contentOrNull
                    if (!imageUrl.isNullOrEmpty()) {
                        parseDataUrl(imageUrl)?.let { (mime, data) ->
                            gotAny = true
                            emit(ChatStreamEvent.ImageGenerated(mime, data))
                        }
                    }
                } catch (e: Exception) {
                    // ignore malformed keep-alive lines
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
            return kotlinx.serialization.json.JsonPrimitive(textPart)
        }

        return buildJsonArray {
            add(buildJsonObject {
                put("type", "text")
                put("text", textPart)
            })
            for (img in images) {
                add(buildJsonObject {
                    put("type", "image_url")
                    put("image_url", buildJsonObject {
                        put("url", "data:${img.mimeType};base64,${img.base64Data}")
                    })
                })
            }
        }
    }
}
