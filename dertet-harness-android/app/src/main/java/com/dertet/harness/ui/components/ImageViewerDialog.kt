package com.dertet.harness.ui.components

import android.Manifest
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.dertet.harness.R
import com.dertet.harness.ui.GeneratedImage
import com.dertet.harness.util.hasLegacyStoragePermission
import com.dertet.harness.util.saveBitmapToGallery
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImageViewerDialog(image: GeneratedImage, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    var saving by remember { mutableStateOf(false) }

    val savedMessage = stringResource(R.string.image_viewer_saved)
    val saveFailedMessage = stringResource(R.string.image_viewer_save_failed)
    val permissionNeededMessage = stringResource(R.string.image_viewer_permission_needed)

    val bitmap = remember(image.base64Data) {
        try {
            val bytes = Base64.decode(image.base64Data, Base64.NO_WRAP)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (e: Exception) {
            null
        }
    }

    fun persistBitmap(bmp: Bitmap) {
        scope.launch {
            saving = true
            val ok = saveBitmapToGallery(context, bmp, "dertetgpt_${System.currentTimeMillis()}.jpg")
            saving = false
            snackbarHostState.showSnackbar(if (ok) savedMessage else saveFailedMessage)
        }
    }

    var pendingSaveBitmap by remember { mutableStateOf<Bitmap?>(null) }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val bmp = pendingSaveBitmap
        pendingSaveBitmap = null
        if (granted && bmp != null) {
            persistBitmap(bmp)
        } else if (!granted) {
            scope.launch { snackbarHostState.showSnackbar(permissionNeededMessage) }
        }
    }

    fun requestSave() {
        val bmp = bitmap ?: return
        if (hasLegacyStoragePermission(context)) {
            persistBitmap(bmp)
        } else {
            pendingSaveBitmap = bmp
            permissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Scaffold(
            containerColor = Color.Black,
            snackbarHost = { SnackbarHost(snackbarHostState) }
        ) { padding ->
            Box(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .background(Color.Black)
            ) {
                if (bitmap != null) {
                    Image(
                        bitmap = bitmap.asImageBitmap(),
                        contentDescription = null,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Text(
                        stringResource(R.string.image_viewer_load_failed),
                        color = Color.White,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                ) {
                    Icon(Icons.Filled.Close, contentDescription = stringResource(R.string.image_viewer_close_desc), tint = Color.White)
                }

                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(24.dp)
                ) {
                    if (saving) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(40.dp))
                    } else {
                        IconButton(
                            onClick = { requestSave() },
                            modifier = Modifier.background(Color.White.copy(alpha = 0.15f), shape = CircleShape)
                        ) {
                            Icon(Icons.Filled.Download, contentDescription = stringResource(R.string.image_viewer_download_desc), tint = Color.White)
                        }
                    }
                }
            }
        }
    }
}
