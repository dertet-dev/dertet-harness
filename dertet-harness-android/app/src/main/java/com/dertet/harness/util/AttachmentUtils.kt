package com.dertet.harness.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import com.dertet.harness.data.Attachment
import com.dertet.harness.data.AttachmentKind
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

private const val MAX_IMAGE_DIMENSION = 1536
private const val MAX_TEXT_CHARS = 60_000
private val TEXT_EXTENSIONS = setOf(
    "txt", "md", "markdown", "json", "csv", "xml", "html", "htm", "kt", "java",
    "py", "js", "ts", "tsx", "jsx", "c", "cpp", "h", "hpp", "cs", "go", "rs",
    "yaml", "yml", "gradle", "properties", "log", "sh", "bat", "sql", "css"
)

suspend fun loadAttachmentFromUri(context: Context, uri: Uri): Attachment? = withContext(Dispatchers.IO) {
    val resolver = context.contentResolver
    val mimeType = resolver.getType(uri) ?: "application/octet-stream"
    val fileName = queryDisplayName(context, uri) ?: uri.lastPathSegment ?: "file"

    if (mimeType.startsWith("image/")) {
        val bytes = downscaleImage(context, uri) ?: return@withContext null
        val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
        return@withContext Attachment(
            fileName = fileName,
            mimeType = "image/jpeg",
            kind = AttachmentKind.IMAGE,
            base64Data = base64
        )
    }

    val ext = fileName.substringAfterLast('.', "").lowercase()
    val isText = mimeType.startsWith("text/") || ext in TEXT_EXTENSIONS
    if (isText) {
        val text = try {
            resolver.openInputStream(uri)?.use { it.readBytes().toString(Charsets.UTF_8) }
        } catch (e: Exception) { null }
        val trimmed = text?.take(MAX_TEXT_CHARS)
        return@withContext Attachment(
            fileName = fileName,
            mimeType = mimeType,
            kind = AttachmentKind.FILE,
            textContent = trimmed ?: "(не вдалося прочитати вміст файлу)"
        )
    }

    Attachment(
        fileName = fileName,
        mimeType = mimeType,
        kind = AttachmentKind.FILE,
        textContent = null
    )
}

private fun queryDisplayName(context: Context, uri: Uri): String? {
    return try {
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val idx = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            if (idx >= 0 && cursor.moveToFirst()) cursor.getString(idx) else null
        }
    } catch (e: Exception) {
        null
    }
}

private fun downscaleImage(context: Context, uri: Uri): ByteArray? {
    return try {
        val resolver = context.contentResolver
        val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, boundsOptions) }
        val (w, h) = boundsOptions.outWidth to boundsOptions.outHeight
        var sampleSize = 1
        var halfW = w / 2
        var halfH = h / 2
        while (halfW / sampleSize >= MAX_IMAGE_DIMENSION || halfH / sampleSize >= MAX_IMAGE_DIMENSION) {
            sampleSize *= 2
        }
        val opts = BitmapFactory.Options().apply { inSampleSize = sampleSize }
        val bitmap = resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, opts) } ?: return null
        val scaled = scaleDownIfNeeded(bitmap)
        val outStream = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, 85, outStream)
        if (scaled !== bitmap) bitmap.recycle()
        scaled.recycle()
        outStream.toByteArray()
    } catch (e: Exception) {
        null
    }
}

private fun scaleDownIfNeeded(bitmap: Bitmap): Bitmap {
    val maxDim = maxOf(bitmap.width, bitmap.height)
    if (maxDim <= MAX_IMAGE_DIMENSION) return bitmap
    val scale = MAX_IMAGE_DIMENSION.toFloat() / maxDim
    val newW = (bitmap.width * scale).toInt().coerceAtLeast(1)
    val newH = (bitmap.height * scale).toInt().coerceAtLeast(1)
    return Bitmap.createScaledBitmap(bitmap, newW, newH, true)
}
