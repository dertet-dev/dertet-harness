package com.dertet.gpt.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.InsertDriveFile
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.dertet.gpt.R
import com.dertet.gpt.data.Attachment
import com.dertet.gpt.data.AttachmentKind
import com.dertet.gpt.ui.theme.DertetOnSurfaceMuted
import com.dertet.gpt.ui.theme.DertetSurfaceHigh

@Composable
fun PendingAttachmentChip(attachment: Attachment, onRemove: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(DertetSurfaceHigh)
            .padding(6.dp)
    ) {
        if (attachment.kind == AttachmentKind.IMAGE && attachment.base64Data != null) {
            val bitmap = remember(attachment.base64Data) {
                val bytes = android.util.Base64.decode(attachment.base64Data, android.util.Base64.NO_WRAP)
                android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            }
            AsyncImage(
                model = bitmap,
                contentDescription = attachment.fileName,
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(8.dp))
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .widthIn(max = 120.dp)
                    .padding(4.dp)
            ) {
                Icon(Icons.Filled.InsertDriveFile, contentDescription = null, tint = DertetOnSurfaceMuted)
                Text(
                    text = attachment.fileName,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }
        }
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(18.dp)
                .clip(CircleShape)
                .background(DertetSurfaceHigh)
                .clickable(onClick = onRemove)
        ) {
            Icon(
                Icons.Filled.Close,
                contentDescription = stringResource(R.string.remove_attachment),
                tint = DertetOnSurfaceMuted,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
