package com.dertet.gpt.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dertet.gpt.ui.theme.DertetOnSurfaceMuted
import com.dertet.gpt.ui.theme.DertetSurfaceHigh
import kotlinx.coroutines.delay

private val FENCE_REGEX = Regex("```(\\w*)\\n([\\s\\S]*?)```")

private sealed class RichSegment
private data class TextSeg(val text: String) : RichSegment()
private data class CodeSeg(val lang: String, val code: String) : RichSegment()

private fun splitCodeFences(text: String): List<RichSegment> {
    val result = mutableListOf<RichSegment>()
    var lastIndex = 0
    for (match in FENCE_REGEX.findAll(text)) {
        if (match.range.first > lastIndex) {
            result.add(TextSeg(text.substring(lastIndex, match.range.first)))
        }
        result.add(CodeSeg(match.groupValues[1], match.groupValues[2].removeSuffix("\n")))
        lastIndex = match.range.last + 1
    }
    if (lastIndex < text.length) result.add(TextSeg(text.substring(lastIndex)))
    return result
}

/** Renders message text, extracting fenced ```lang code blocks into copyable code cards. */
@Composable
fun RichMessageText(text: String, textColor: androidx.compose.ui.graphics.Color) {
    val segments = remember(text) { splitCodeFences(text) }
    androidx.compose.foundation.layout.Column {
        segments.forEach { seg ->
            when (seg) {
                is TextSeg -> if (seg.text.isNotBlank()) {
                    Text(text = seg.text.trim('\n'), color = textColor, style = MaterialTheme.typography.bodyLarge)
                }
                is CodeSeg -> CodeBlockCard(lang = seg.lang, code = seg.code)
            }
        }
    }
}

@Composable
private fun CodeBlockCard(lang: String, code: String) {
    val clipboard = LocalClipboardManager.current
    var copied by remember { mutableStateOf(false) }

    LaunchedEffect(copied) {
        if (copied) {
            delay(1500)
            copied = false
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .clip(RoundedCornerShape(3.dp))
            .background(DertetSurfaceHigh)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        androidx.compose.foundation.layout.Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = lang.ifBlank { "text" },
                    color = DertetOnSurfaceMuted,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp
                )
                IconButton(
                    onClick = {
                        clipboard.setText(AnnotatedString(code))
                        copied = true
                    },
                    modifier = Modifier.padding(0.dp)
                ) {
                    Icon(
                        if (copied) Icons.Filled.Check else Icons.Filled.ContentCopy,
                        contentDescription = "Копіювати",
                        tint = DertetOnSurfaceMuted,
                        modifier = Modifier.padding(4.dp)
                    )
                }
            }
            Text(
                text = code,
                color = androidx.compose.ui.graphics.Color(0xFFD8D4E6),
                fontFamily = FontFamily.Monospace,
                fontSize = 12.5.sp,
                lineHeight = 18.sp,
                modifier = Modifier
                    .padding(top = 4.dp)
                    .horizontalScroll(rememberScrollState())
            )
        }
    }
}
