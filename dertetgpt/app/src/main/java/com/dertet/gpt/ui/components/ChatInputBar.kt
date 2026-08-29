package com.dertet.gpt.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.InsertDriveFile
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Photo
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.dertet.gpt.R
import com.dertet.gpt.data.Attachment
import com.dertet.gpt.ui.theme.DertetOnSurfaceMuted
import com.dertet.gpt.ui.theme.DertetOutline
import com.dertet.gpt.ui.theme.DertetPrimary
import com.dertet.gpt.ui.theme.DertetSurfaceHigh

@Composable
fun ChatInputBar(
    text: String,
    onTextChange: (String) -> Unit,
    attachments: List<Attachment>,
    onRemoveAttachment: (Attachment) -> Unit,
    onPickImage: () -> Unit,
    onPickFile: () -> Unit,
    onPickCamera: () -> Unit,
    onVoiceInput: () -> Unit,
    isSending: Boolean,
    onSend: () -> Unit,
    onStop: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .navigationBarsPadding()
            .imePadding()
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        if (attachments.isNotEmpty()) {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                items(attachments) { att ->
                    PendingAttachmentChip(attachment = att, onRemove = { onRemoveAttachment(att) })
                }
            }
        }

        Row(
            verticalAlignment = Alignment.Bottom,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(26.dp))
                .background(DertetSurfaceHigh)
                .border(BorderStroke(1.dp, DertetOutline), RoundedCornerShape(26.dp))
                .padding(4.dp)
        ) {
            var menuExpanded by remember { mutableStateOf(false) }
            Box {
                IconButton(onClick = { menuExpanded = true }) {
                    Icon(Icons.Filled.Add, contentDescription = stringResource(R.string.attach_desc), tint = DertetOnSurfaceMuted)
                }
                DropdownMenu(
                    expanded = menuExpanded,
                    onDismissRequest = { menuExpanded = false },
                    modifier = Modifier.background(DertetSurfaceHigh)
                ) {
                    DropdownMenuItem(
                        text = { Text(stringResource(R.string.attach_camera)) },
                        leadingIcon = { Icon(Icons.Filled.CameraAlt, contentDescription = null) },
                        onClick = { menuExpanded = false; onPickCamera() }
                    )
                    DropdownMenuItem(
                        text = { Text(stringResource(R.string.attach_photo)) },
                        leadingIcon = { Icon(Icons.Filled.Photo, contentDescription = null) },
                        onClick = { menuExpanded = false; onPickImage() }
                    )
                    DropdownMenuItem(
                        text = { Text(stringResource(R.string.attach_file)) },
                        leadingIcon = { Icon(Icons.Filled.InsertDriveFile, contentDescription = null) },
                        onClick = { menuExpanded = false; onPickFile() }
                    )
                }
            }

            TextField(
                value = text,
                onValueChange = onTextChange,
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 44.dp, max = 160.dp),
                placeholder = { Text(stringResource(R.string.message_input_hint), color = DertetOnSurfaceMuted) },
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    disabledContainerColor = Color.Transparent,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    disabledIndicatorColor = Color.Transparent
                ),
                maxLines = 6
            )

            val canSend = (text.isNotBlank() || attachments.isNotEmpty())

            if (!canSend && !isSending) {
                IconButton(onClick = onVoiceInput) {
                    Icon(Icons.Filled.Mic, contentDescription = stringResource(R.string.voice_input_desc), tint = DertetOnSurfaceMuted)
                }
            }
            Box(
                modifier = Modifier
                    .padding(4.dp)
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(if (isSending) MaterialTheme.colorScheme.error else if (canSend) DertetPrimary else DertetSurfaceHigh),
                contentAlignment = Alignment.Center
            ) {
                IconButton(onClick = { if (isSending) onStop() else if (canSend) onSend() }) {
                    Icon(
                        imageVector = if (isSending) Icons.Filled.Stop else Icons.Filled.ArrowUpward,
                        contentDescription = stringResource(if (isSending) R.string.stop_desc else R.string.send_desc),
                        tint = Color.White
                    )
                }
            }
        }
    }
}
