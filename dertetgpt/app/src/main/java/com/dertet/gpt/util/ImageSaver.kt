package com.dertet.gpt.util

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

/**
 * Saves a bitmap to the shared Pictures/DertetHarness collection.
 * Uses scoped storage (MediaStore) on API 29+, no permission needed there.
 * On API 26-28 it writes directly to the legacy public directory; the caller
 * is responsible for having already obtained WRITE_EXTERNAL_STORAGE on those versions.
 */
suspend fun saveBitmapToGallery(context: Context, bitmap: Bitmap, displayName: String): Boolean =
    withContext(Dispatchers.IO) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = context.contentResolver
                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, displayName)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
                    put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/DertetHarness")
                }
                val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return@withContext false
                val outputStream = resolver.openOutputStream(uri) ?: return@withContext false
                outputStream.use { out -> bitmap.compress(Bitmap.CompressFormat.JPEG, 92, out) }
            } else {
                @Suppress("DEPRECATION")
                val picturesDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "DertetHarness")
                if (!picturesDir.exists()) picturesDir.mkdirs()
                val file = File(picturesDir, displayName)
                val compressed = FileOutputStream(file).use { out ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 92, out)
                }
                if (compressed) {
                    android.media.MediaScannerConnection.scanFile(context, arrayOf(file.absolutePath), arrayOf("image/jpeg"), null)
                }
                compressed
            }
        } catch (e: Exception) {
            false
        }
    }

fun hasLegacyStoragePermission(context: Context): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) return true
    return ContextCompat.checkSelfPermission(context, android.Manifest.permission.WRITE_EXTERNAL_STORAGE) ==
        android.content.pm.PackageManager.PERMISSION_GRANTED
}
