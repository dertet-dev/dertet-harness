package com.dertet.gpt.network

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import java.io.IOException

data class RawSseEvent(val type: String?, val data: String)

fun sseFlow(client: OkHttpClient, request: Request): Flow<RawSseEvent> = callbackFlow {
    val listener = object : EventSourceListener() {
        override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
            trySend(RawSseEvent(type, data))
        }

        override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
            val bodyMsg = try { response?.body?.string() } catch (e: Exception) { null }
            val msg = when {
                !bodyMsg.isNullOrBlank() -> bodyMsg
                t != null -> t.message ?: t.toString()
                response != null -> "HTTP ${response.code}"
                else -> "Невідома помилка з’єднання"
            }
            close(IOException(msg))
        }

        override fun onClosed(eventSource: EventSource) {
            close()
        }
    }
    val eventSource = EventSources.createFactory(client).newEventSource(request, listener)
    awaitClose { eventSource.cancel() }
}
