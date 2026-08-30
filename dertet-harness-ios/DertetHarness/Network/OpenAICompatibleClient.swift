import Foundation

final class OpenAICompatibleClient: ChatClient {
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
                    if !systemPrompt.isEmpty {
                        messages.append(["role": "system", "content": systemPrompt])
                    }
                    for msg in history {
                        messages.append(["role": msg.role, "content": buildContent(msg)])
                    }

                    let body: [String: Any] = ["model": model, "stream": true, "messages": messages]

                    guard let url = URL(string: baseUrl.trimmedTrailingSlash + "/chat/completions") else {
                        continuation.finish(throwing: URLError(.badURL))
                        return
                    }
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
                    if baseUrl.contains("openrouter.ai") {
                        request.setValue("https://dertetharness.app", forHTTPHeaderField: "HTTP-Referer")
                        request.setValue("Dertet Harness", forHTTPHeaderField: "X-Title")
                    }
                    request.httpBody = jsonString(body)

                    for try await event in sseEvents(for: request) {
                        try Task.checkCancellation()
                        let data = event.data.trimmingCharacters(in: .whitespaces)
                        if data.isEmpty || data == "[DONE]" { continue }
                        guard let jsonData = data.data(using: .utf8),
                              let obj = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else { continue }

                        if let errorObj = asDict(obj["error"]), let msg = asString(errorObj["message"]) {
                            continuation.yield(.error(msg))
                            continue
                        }
                        if let choices = asArray(obj["choices"]),
                           let first = asDict(choices.first),
                           let delta = asDict(first["delta"]),
                           let text = asString(delta["content"]), !text.isEmpty {
                            gotAny = true
                            continuation.yield(.delta(text))
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

        var parts: [[String: Any]] = [["type": "text", "text": text]]
        for img in images {
            parts.append([
                "type": "image_url",
                "image_url": ["url": "data:\(img.mimeType);base64,\(img.base64Data!)"]
            ])
        }
        return parts
    }
}

extension String {
    var trimmedTrailingSlash: String {
        hasSuffix("/") ? String(dropLast()) : self
    }
}
