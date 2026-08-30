import Foundation

final class GeminiClient: ChatClient {
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
                    var contents: [[String: Any]] = []
                    for msg in history {
                        let role = msg.role == "assistant" ? "model" : "user"
                        contents.append(["role": role, "parts": buildParts(msg)])
                    }

                    var body: [String: Any] = ["contents": contents]
                    if !systemPrompt.isEmpty {
                        body["systemInstruction"] = ["parts": [["text": systemPrompt]]]
                    }

                    let cleanModel = model.hasPrefix("models/") ? String(model.dropFirst("models/".count)) : model
                    guard let url = URL(string: baseUrl.trimmedTrailingSlash + "/models/\(cleanModel):streamGenerateContent?alt=sse") else {
                        continuation.finish(throwing: URLError(.badURL))
                        return
                    }
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue(apiKey, forHTTPHeaderField: "x-goog-api-key")
                    request.httpBody = jsonString(body)

                    for try await event in sseEvents(for: request) {
                        try Task.checkCancellation()
                        let data = event.data.trimmingCharacters(in: .whitespaces)
                        if data.isEmpty { continue }
                        guard let jsonData = data.data(using: .utf8),
                              let obj = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else { continue }

                        if let errorObj = asDict(obj["error"]), let msg = asString(errorObj["message"]) {
                            continuation.yield(.error(msg))
                            continue
                        }
                        if let candidates = asArray(obj["candidates"]),
                           let first = asDict(candidates.first),
                           let content = asDict(first["content"]),
                           let parts = asArray(content["parts"]) {
                            let text = parts.compactMap { asString(asDict($0)?["text"]) }.joined()
                            if !text.isEmpty {
                                gotAny = true
                                continuation.yield(.delta(text))
                            }
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

    private func buildParts(_ msg: ChatMessage) -> [[String: Any]] {
        let images = msg.attachments.filter { $0.kind == .image && $0.base64Data != nil }
        let files = msg.attachments.filter { $0.kind == .file }

        var text = msg.text
        for f in files where f.textContent != nil {
            text = "[File: \(f.fileName)]\n\(f.textContent!)\n\n\(text)"
        }

        var parts: [[String: Any]] = [["text": text]]
        for img in images {
            parts.append(["inline_data": ["mime_type": img.mimeType, "data": img.base64Data!]])
        }
        return parts
    }
}
