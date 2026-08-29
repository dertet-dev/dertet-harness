@file:OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)

package com.dertet.gpt.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.dertet.gpt.R
import com.dertet.gpt.data.db.ChatEntity
import com.dertet.gpt.ui.theme.DertetOnSurfaceMuted
import com.dertet.gpt.ui.theme.DertetPrimary
import com.dertet.gpt.ui.theme.DertetSurface
import com.dertet.gpt.ui.theme.DertetSurfaceHigh

@Composable
fun DrawerContent(
    chats: List<ChatEntity>,
    currentChatId: String?,
    onNewChat: () -> Unit,
    onSelectChat: (String) -> Unit,
    onDeleteChat: (String) -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .width(300.dp)
            .background(MaterialTheme.colorScheme.background)
            .padding(vertical = 16.dp)
    ) {
        Text(
            text = "Dertet Harness",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp)
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(DertetSurface)
                .combinedClickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onNewChat
                )
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.Add, contentDescription = null, tint = DertetPrimary)
            Spacer(Modifier.width(10.dp))
            Text(stringResource(R.string.new_chat), style = MaterialTheme.typography.titleMedium)
        }

        Spacer(Modifier.height(20.dp))
        Text(
            text = stringResource(R.string.chat_history),
            style = MaterialTheme.typography.labelLarge,
            color = DertetOnSurfaceMuted,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(8.dp))

        if (chats.isEmpty()) {
            Text(
                text = stringResource(R.string.no_chats_yet),
                color = DertetOnSurfaceMuted,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(horizontal = 20.dp)
            )
        }

        LazyColumn(modifier = Modifier.weight(1f)) {
            items(chats, key = { it.id }) { chat ->
                ChatHistoryRow(
                    chat = chat,
                    selected = chat.id == currentChatId,
                    onClick = { onSelectChat(chat.id) },
                    onDelete = { onDeleteChat(chat.id) }
                )
            }
        }

        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 4.dp)
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .combinedClickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onOpenSettings
                )
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.Settings, contentDescription = null, tint = DertetOnSurfaceMuted)
            Spacer(Modifier.width(10.dp))
            Text(stringResource(R.string.settings), style = MaterialTheme.typography.titleMedium)
        }
    }
}

@Composable
private fun ChatHistoryRow(
    chat: ChatEntity,
    selected: Boolean,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }
    Box {
        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 3.dp)
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(if (selected) DertetSurfaceHigh else MaterialTheme.colorScheme.background)
                .combinedClickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClick,
                    onLongClick = { menuExpanded = true }
                )
                .padding(horizontal = 12.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Filled.Chat,
                contentDescription = null,
                tint = DertetOnSurfaceMuted,
                modifier = Modifier.padding(end = 10.dp)
            )
            Text(
                text = chat.title.ifBlank { "Новий чат" },
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f)
            )
        }
        DropdownMenu(
            expanded = menuExpanded,
            onDismissRequest = { menuExpanded = false },
            modifier = Modifier.background(DertetSurfaceHigh)
        ) {
            DropdownMenuItem(
                text = { Text(stringResource(R.string.action_delete)) },
                leadingIcon = { Icon(Icons.Filled.Delete, contentDescription = null) },
                onClick = { menuExpanded = false; onDelete() }
            )
        }
    }
}
