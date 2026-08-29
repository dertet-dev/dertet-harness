import Foundation

final class AnthropicClient: ChatClient {
    func streamChat(
        baseUrl: String,
        apiKey: String,
        model: String,
        systemPrompt: String,
        history: [ChatMessage]
    ) -> AsyncThrowingStream<ChatStreamEvent, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                var gotAny = false
                do {
                    var messages: [[String: Any]] = []
                    for msg in history {
                        messages.append(["role": msg.role, "content": buildContent(msg)])
                    }

                    var body: [String: Any] = [
                        "model": model,
                        "max_tokens": 8192,
                        "stream": true,
                        "messages": messages
                    ]
                    if !systemPrompt.isEmpty { body["system"] = systemPrompt }

                    guard let url = URL(string: baseUrl.trimmedTrailingSlash + "/messages") else {
                        continuation.finish(throwing: URLError(.badURL))
                        return
                    }
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
                    request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
                    request.httpBody = jsonString(body)

                    for try await event in sseEvents(for: request) {
                        try Task.checkCancellation()
                        let data = event.data.trimmingCharacters(in: .whitespaces)
                        if data.isEmpty { continue }
                        guard let jsonData = data.data(using: .utf8),
                              let obj = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else { continue }

                        switch event.type {
                        case "content_block_delta":
                            if let delta = asDict(obj["delta"]), let text = asString(delta["text"]), !text.isEmpty {
                                gotAny = true
                                continuation.yield(.delta(text))
                            }
                        case "error":
                            if let errorObj = asDict(obj["error"]), let msg = asString(errorObj["message"]) {
                                continuation.yield(.error(msg))
                            }
                        default:
                            break
                        }
                    }
                    continuation.yield(.done)
                    continuation.finish()
                } catch {
                    if !gotAny {
                        continuation.yield(.error(error.localizedDescription))
                    }
                    continuation.finish()
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    private func buildContent(_ msg: ChatMessage) -> Any {
        let images = msg.attachments.filter { $0.kind == .image && $0.base64Data != nil }
        let files = msg.attachments.filter { $0.kind == .file }

        var text = msg.text
        for f in files where f.textContent != nil {
            text = "[File: \(f.fileName)]\n\(f.textContent!)\n\n\(text)"
        }

        if images.isEmpty { return text }

        var parts: [[String: Any]] = []
        for img in images {
            parts.append([
                "type": "image",
                "source": ["type": "base64", "media_type": img.mimeType, "data": img.base64Data!]
            ])
        }
        parts.append(["type": "text", "text": text])
        return parts
    }
}
