package com.dertet.gpt.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.InsertDriveFile
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.dertet.gpt.R
import com.dertet.gpt.data.Attachment
import com.dertet.gpt.data.AttachmentKind
import com.dertet.gpt.ui.GeneratedImage
import com.dertet.gpt.ui.UiMessage
import com.dertet.gpt.ui.theme.DertetOnSurfaceMuted
import com.dertet.gpt.ui.theme.DertetPrimary
import com.dertet.gpt.ui.theme.DertetSecondary
import com.dertet.gpt.ui.theme.DertetSurface
import com.dertet.gpt.ui.theme.DertetSurfaceHigh

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MessageBubble(
    message: UiMessage,
    modifier: Modifier = Modifier,
    onEditRequested: (UiMessage) -> Unit = {},
    onImageClick: (GeneratedImage) -> Unit = {}
) {
    val isUser = message.role == "user"
    val clipboard = LocalClipboardManager.current
    var menuExpanded by remember { mutableStateOf(false) }

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Column(
            modifier = Modifier.widthIn(max = 320.dp),
            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
        ) {
            if (message.attachments.isNotEmpty()) {
                AttachmentPreviewRow(message.attachments)
            }

            if (message.isGeneratingImage) {
                ImageGenerationPlaceholder(modifier = Modifier.padding(bottom = if (message.content.isNotBlank()) 6.dp else 0.dp))
            } else {
                message.generatedImage?.let { img ->
                    GeneratedImageView(
                        image = img,
                        onClick = { onImageClick(img) },
                        modifier = Modifier.padding(bottom = if (message.content.isNotBlank()) 6.dp else 0.dp)
                    )
                }
            }

            if (message.content.isNotBlank() || message.isStreaming) {
                Box(
                    modifier = Modifier
                        .clip(
                            RoundedCornerShape(
                                topStart = 18.dp, topEnd = 18.dp,
                                bottomStart = if (isUser) 18.dp else 4.dp,
                                bottomEnd = if (isUser) 4.dp else 18.dp
                            )
                        )
                        .background(
                            when {
                                message.isError -> MaterialTheme.colorScheme.error.copy(alpha = 0.15f)
                                isUser -> DertetPrimary.copy(alpha = 0.9f)
                                else -> DertetSurface
                            }
                        )
                        .then(
                            if (isUser) {
                                Modifier.combinedClickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null,
                                    onClick = {},
                                    onLongClick = { menuExpanded = true }
                                )
                            } else Modifier
                        )
                        .padding(horizontal = 14.dp, vertical = 10.dp)
                ) {
                    SelectionContainer {
                        Column {
                            val textColor = when {
                                message.isError -> MaterialTheme.colorScheme.error
                                isUser -> Color.White
                                else -> MaterialTheme.colorScheme.onSurface
                            }
                            if (message.content.isBlank()) {
                                Text(text = "…", color = textColor, style = MaterialTheme.typography.bodyLarge)
                            } else {
                                RichMessageText(text = message.content, textColor = textColor)
                            }
                            if (message.isStreaming) {
                                TypingDots()
                            }
                        }
                    }
                    if (isUser) {
                        DropdownMenu(
                            expanded = menuExpanded,
                            onDismissRequest = { menuExpanded = false },
                            modifier = Modifier.background(DertetSurfaceHigh)
                        ) {
                            DropdownMenuItem(
                                text = { Text(stringResource(R.string.action_copy)) },
                                leadingIcon = { Icon(Icons.Filled.ContentCopy, contentDescription = null) },
                                onClick = {
                                    clipboard.setText(AnnotatedString(message.content))
                                    menuExpanded = false
                                }
                            )
                            DropdownMenuItem(
                                text = { Text(stringResource(R.string.action_edit)) },
                                leadingIcon = { Icon(Icons.Filled.Edit, contentDescription = null) },
                                onClick = {
                                    onEditRequested(message)
                                    menuExpanded = false
                                }
                            )
                        }
                    }
                }
            }
            if (!isUser && !message.isStreaming && message.content.isNotBlank()) {
                IconButton(
                    onClick = { clipboard.setText(AnnotatedString(message.content)) },
                    modifier = Modifier.padding(top = 2.dp)
                ) {
                    Icon(
                        Icons.Filled.ContentCopy,
                        contentDescription = null,
                        tint = DertetOnSurfaceMuted,
                        modifier = Modifier.padding(2.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun GeneratedImageView(image: GeneratedImage, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val bitmap = remember(image.base64Data) {
        try {
            val bytes = android.util.Base64.decode(image.base64Data, android.util.Base64.NO_WRAP)
            android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (e: Exception) {
            null
        }
    }
    if (bitmap != null) {
        AsyncImage(
            model = bitmap,
            contentDescription = null,
            modifier = modifier
                .clip(RoundedCornerShape(16.dp))
                .widthIn(max = 260.dp)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClick
                )
        )
    }
}

@Composable
private fun TypingDots() {
    val transition = rememberInfiniteTransition(label = "typing")
    val alpha by transition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(700, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "typingAlpha"
    )
    Text(
        text = "●●●",
        color = DertetSecondary.copy(alpha = alpha),
        style = MaterialTheme.typography.labelLarge,
        modifier = Modifier.padding(top = 4.dp)
    )
}

@Composable
private fun AttachmentPreviewRow(attachments: List<Attachment>) {
    Row(
        modifier = Modifier.padding(bottom = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        attachments.take(4).forEach { att ->
            if (att.kind == AttachmentKind.IMAGE && att.base64Data != null) {
                val bitmap = remember(att.base64Data) {
                    val bytes = android.util.Base64.decode(att.base64Data, android.util.Base64.NO_WRAP)
                    android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                }
                AsyncImage(
                    model = bitmap,
                    contentDescription = att.fileName,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .widthIn(max = 96.dp)
                )
            } else {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(DertetSurface)
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.InsertDriveFile, contentDescription = null, tint = DertetOnSurfaceMuted)
                    Text(
                        text = att.fileName,
                        color = DertetOnSurfaceMuted,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(start = 4.dp)
                    )
                }
            }
        }
    }
}
