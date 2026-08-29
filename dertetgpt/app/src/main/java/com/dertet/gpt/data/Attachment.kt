package com.dertet.gpt.data

import kotlinx.serialization.Serializable

enum class AttachmentKind { IMAGE, FILE }

@Serializable
data class Attachment(
    val fileName: String,
    val mimeType: String,
    val kind: AttachmentKind,
    val base64Data: String? = null,
    val textContent: String? = null
)
