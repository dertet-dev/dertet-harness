package com.dertet.gpt.util

import android.content.Context
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONTokener
import java.net.URLEncoder

private const val SEARCH_TIMEOUT_MS = 15_000L
private const val MAX_RESULT_CHARS = 3000

/**
 * Performs a web search using a headless (never attached/shown) WebView loading
 * DuckDuckGo's plain HTML results page, then reads the rendered text back out.
 *
 * Security notes:
 * - The only URL ever loaded is one this class builds itself from a URL-encoded
 *   query; the model's search query is never used as a raw URL/scheme, so it
 *   cannot redirect the WebView anywhere else.
 * - No JavaScript bridge is registered (no addJavascriptInterface), so the page
 *   has no way to call back into the app.
 * - File/content access and popups are disabled; only the network request this
 *   class issues is ever made.
 */
class WebSearchService(private val context: Context) {

    suspend fun search(query: String): String {
        val cleanQuery = query.replace(Regex("[\\r\\n]+"), " ").trim().take(200)
        if (cleanQuery.isBlank()) return ""
        return withContext(Dispatchers.Main.immediate) {
            withTimeoutOrNull(SEARCH_TIMEOUT_MS) { fetchResultsText(cleanQuery) } ?: ""
        }
    }

    private suspend fun fetchResultsText(query: String): String = suspendCancellableCoroutine { cont ->
        val webView = WebView(context.applicationContext)
        var finished = false

        fun finish(result: String) {
            if (finished) return
            finished = true
            if (cont.isActive) cont.resumeWith(Result.success(result))
            webView.destroy()
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = false
            allowFileAccess = false
            allowContentAccess = false
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = false
            mediaPlaybackRequiresUserGesture = true
            loadsImagesAutomatically = false
        }
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String?) {
                view.evaluateJavascript("document.body ? document.body.innerText : ''") { raw ->
                    finish(cleanResultText(decodeJsString(raw)))
                }
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame != false) finish("")
            }
        }

        cont.invokeOnCancellation { webView.destroy() }

        val encoded = URLEncoder.encode(query, "UTF-8")
        webView.loadUrl("https://html.duckduckgo.com/html/?q=$encoded")
    }

    private fun decodeJsString(raw: String?): String {
        if (raw.isNullOrEmpty() || raw == "null") return ""
        return try {
            JSONTokener(raw).nextValue() as? String ?: ""
        } catch (e: Exception) {
            ""
        }
    }

    private fun cleanResultText(text: String): String {
        val normalized = text.replace(Regex("[ \\t]+"), " ").replace(Regex("\\n{3,}"), "\n\n").trim()
        return normalized.take(MAX_RESULT_CHARS)
    }
}
