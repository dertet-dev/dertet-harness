package com.dertet.gpt.ui

import com.dertet.gpt.data.Attachment

data class GeneratedImage(val mimeType: String, val base64Data: String)

data class UiMessage(
    val id: String,
    val role: String,
    val content: String,
    val attachments: List<Attachment> = emptyList(),
    val isError: Boolean = false,
    val isStreaming: Boolean = false,
    val generatedImage: GeneratedImage? = null,
    /** True once the model has started sending image data but the stream hasn't finished yet. */
    val isGeneratingImage: Boolean = false
)

data class StreamingState(
    val messageId: String,
    val text: String,
    val pendingImage: GeneratedImage? = null,
    val searchingQuery: String? = null
)
