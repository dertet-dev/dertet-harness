package com.dertet.harness.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

val DertetBackground = Color(0xFF121016)
val DertetSurface = Color(0xFF1B1822)
val DertetSurfaceHigh = Color(0xFF242030)
val DertetPrimary = Color(0xFF8B6CFF)
val DertetSecondary = Color(0xFF2BE0C6)
val DertetOnBackground = Color(0xFFEDEAF5)
val DertetOnSurfaceMuted = Color(0xFF9A93AC)
val DertetError = Color(0xFFFF5470)
val DertetOutline = Color(0xFF332E40)

private val DertetDarkScheme = darkColorScheme(
    primary = DertetPrimary,
    onPrimary = Color(0xFF1A1030),
    secondary = DertetSecondary,
    onSecondary = Color(0xFF06231F),
    background = DertetBackground,
    onBackground = DertetOnBackground,
    surface = DertetSurface,
    onSurface = DertetOnBackground,
    surfaceVariant = DertetSurfaceHigh,
    onSurfaceVariant = DertetOnSurfaceMuted,
    error = DertetError,
    onError = Color.White,
    outline = DertetOutline
)

@Composable
fun DertetHarnessTheme(content: @Composable () -> Unit) {
    // Dark theme is mandatory for this app regardless of system setting.
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            window.statusBarColor = DertetBackground.toArgb()
            window.navigationBarColor = DertetBackground.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = DertetDarkScheme,
        typography = DertetTypography,
        content = content
    )
}
