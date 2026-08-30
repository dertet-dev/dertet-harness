package com.dertet.harness.ui

import com.dertet.harness.data.Attachment
import com.dertet.harness.data.db.MessageEntity
import com.dertet.harness.network.ChatMessage
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val json = Json { ignoreUnknownKeys = true }

fun List<Attachment>.toJsonOrNull(): String? = if (isEmpty()) null else json.encodeToString(this)

fun String?.toAttachments(): List<Attachment> {
    if (this.isNullOrBlank()) return emptyList()
    return try {
        json.decodeFromString(this)
    } catch (e: Exception) {
        emptyList()
    }
}

fun MessageEntity.toUiMessage(): UiMessage = UiMessage(
    id = id,
    role = role,
    content = content,
    attachments = attachmentsJson.toAttachments(),
    isError = isError,
    generatedImage = if (generatedImageMime != null && generatedImageData != null) {
        GeneratedImage(generatedImageMime, generatedImageData)
    } else null
)

fun MessageEntity.toChatMessage(): ChatMessage = ChatMessage(
    role = role,
    text = content,
    attachments = attachmentsJson.toAttachments()
)
