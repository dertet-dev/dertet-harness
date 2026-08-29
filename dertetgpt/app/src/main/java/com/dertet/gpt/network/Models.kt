package com.dertet.gpt.network

import com.dertet.gpt.data.Attachment

data class ChatMessage(
    val role: String,
    val text: String,
    val attachments: List<Attachment> = emptyList()
)

sealed class ChatStreamEvent {
    data class Delta(val text: String) : ChatStreamEvent()
    data class ImageGenerated(val mimeType: String, val base64Data: String) : ChatStreamEvent()
    data class Error(val message: String) : ChatStreamEvent()
    data object Done : ChatStreamEvent()
}

class ChatClientException(message: String) : Exception(message)

/** Parses a "data:image/png;base64,XXXX" URL into (mimeType, base64Data), or null if malformed. */
fun parseDataUrl(url: String): Pair<String, String>? {
    if (!url.startsWith("data:")) return null
    val commaIdx = url.indexOf(',')
    if (commaIdx < 0) return null
    val header = url.substring(5, commaIdx) // e.g. "image/png;base64"
    if (!header.endsWith(";base64")) return null
    val mimeType = header.removeSuffix(";base64")
    val base64Data = url.substring(commaIdx + 1)
    if (mimeType.isBlank() || base64Data.isBlank()) return null
    return mimeType to base64Data
}
