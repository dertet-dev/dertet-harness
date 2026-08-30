package com.dertet.harness.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import com.dertet.harness.ui.theme.DertetSurface
import com.dertet.harness.ui.theme.DertetSurfaceHigh

/** A shimmering dark placeholder shown while the AI is generating an image. */
@Composable
fun ImageGenerationPlaceholder(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val shift by transition.animateFloat(
        initialValue = -1f,
        targetValue = 2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerShift"
    )
    val brush = Brush.linearGradient(
        colors = listOf(DertetSurface, DertetSurfaceHigh, DertetSurface),
        start = Offset(shift * 300f, 0f),
        end = Offset(shift * 300f + 300f, 300f)
    )
    androidx.compose.foundation.layout.Box(
        modifier = modifier
            .size(220.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(brush)
    )
}
