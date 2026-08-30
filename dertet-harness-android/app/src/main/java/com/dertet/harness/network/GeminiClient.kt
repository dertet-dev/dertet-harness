package com.dertet.harness.network

import com.dertet.harness.data.AttachmentKind
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.json.Json
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

class GeminiClient : ChatClient {

    override fun streamChat(
        baseUrl: String,
        apiKey: String,
        model: String,
        systemPrompt: String,
        history: List<ChatMessage>
    ): Flow<ChatStreamEvent> = flow {
        val contents = buildJsonArray {
            for (msg in history) {
                val role = if (msg.role == "assistant") "model" else "user"
                add(buildJsonObject {
                    put("role", role)
                    put("parts", buildParts(msg))
                })
            }
        }

        val bodyBuilder = buildJsonObject {
            put("contents", contents)
            if (systemPrompt.isNotBlank()) {
                put("systemInstruction", buildJsonObject {
                    put("parts", buildJsonArray {
                        add(buildJsonObject { put("text", systemPrompt) })
                    })
                })
            }
        }
        val body = bodyBuilder.toString().toRequestBody("application/json".toMediaType())

        val cleanModel = model.removePrefix("models/")
        val url = baseUrl.trimEnd('/') + "/models/$cleanModel:streamGenerateContent?alt=sse"
        val request = Request.Builder()
            .url(url)
            .addHeader("x-goog-api-key", apiKey)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build()

        var gotAny = false
        try {
            sseFlow(sharedHttpClient, request).collect { event ->
                val data = event.data.trim()
                if (data.isEmpty()) return@collect
                try {
                    val json = Json.parseToJsonElement(data).jsonObject
                    val errorObj = json["error"]?.jsonObject
                    if (errorObj != null) {
                        val msg = errorObj["message"]?.jsonPrimitive?.contentOrNull ?: "API error"
                        emit(ChatStreamEvent.Error(msg))
                        return@collect
                    }
                    val candidates = json["candidates"]?.jsonArray
                    val parts = candidates?.firstOrNull()?.jsonObject?.get("content")?.jsonObject
                        ?.get("parts")?.jsonArray
                    val text = parts?.joinToString("") { it.jsonObject["text"]?.jsonPrimitive?.contentOrNull ?: "" }
                    if (!text.isNullOrEmpty()) {
                        gotAny = true
                        emit(ChatStreamEvent.Delta(text))
                    }
                    parts?.forEach { part ->
                        val inline = part.jsonObject["inlineData"]?.jsonObject
                            ?: part.jsonObject["inline_data"]?.jsonObject
                        val mime = inline?.get("mimeType")?.jsonPrimitive?.contentOrNull
                            ?: inline?.get("mime_type")?.jsonPrimitive?.contentOrNull
                        val imgData = inline?.get("data")?.jsonPrimitive?.contentOrNull
                        if (!mime.isNullOrEmpty() && !imgData.isNullOrEmpty()) {
                            gotAny = true
                            emit(ChatStreamEvent.ImageGenerated(mime, imgData))
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

    private fun buildParts(msg: ChatMessage): kotlinx.serialization.json.JsonElement {
        val images = msg.attachments.filter { it.kind == AttachmentKind.IMAGE && it.base64Data != null }
        val files = msg.attachments.filter { it.kind == AttachmentKind.FILE }

        var textPart = msg.text
        for (f in files) {
            if (f.textContent != null) {
                textPart = "[Файл: ${f.fileName}]\n${f.textContent}\n\n$textPart"
            }
        }

        return buildJsonArray {
            add(buildJsonObject { put("text", textPart) })
            for (img in images) {
                add(buildJsonObject {
                    put("inline_data", buildJsonObject {
                        put("mime_type", img.mimeType)
                        put("data", img.base64Data)
                    })
                })
            }
        }
    }
}
