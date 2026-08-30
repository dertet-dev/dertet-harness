import Foundation

struct RawSSEEvent {
    var type: String?
    var data: String
}

enum SSEError: LocalizedError {
    case http(Int, String)

    var errorDescription: String? {
        switch self {
        case .http(let code, let body):
            return body.isEmpty ? "HTTP \(code)" : body
        }
    }
}

/// Explicit session for streaming requests, rather than relying on URLSession.shared's default
/// config by accident. timeoutIntervalForRequest is an *idle* timeout on URLSession (resets on
/// every byte received, not a total-duration cap) — this is what stops a genuinely stalled
/// connection (server accepts, then goes silent forever) from hanging the chat indefinitely.
private let sseSession: URLSession = {
    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = 60
    return URLSession(configuration: config)
}()

/// Streams Server-Sent Events from a request using URLSession's async byte stream.
/// Cooperative cancellation: cancelling the consuming Task stops the underlying request.
func sseEvents(for request: URLRequest) -> AsyncThrowingStream<RawSSEEvent, Error> {
    AsyncThrowingStream { continuation in
        let task = Task {
            do {
                let (bytes, response) = try await sseSession.bytes(for: request)

                if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                    var bodyText = ""
                    for try await line in bytes.lines { bodyText += line }
                    continuation.finish(throwing: SSEError.http(http.statusCode, bodyText))
                    return
                }

                var currentType: String?
                var currentData: [String] = []

                func flush() {
                    if !currentData.isEmpty {
                        continuation.yield(RawSSEEvent(type: currentType, data: currentData.joined(separator: "\n")))
                    }
                    currentType = nil
                    currentData = []
                }

                for try await line in bytes.lines {
                    try Task.checkCancellation()
                    if line.isEmpty {
                        flush()
                        continue
                    }
                    if line.hasPrefix("event:") {
                        currentType = line.dropFirst(6).trimmingCharacters(in: .whitespaces)
                    } else if line.hasPrefix("data:") {
                        currentData.append(String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces))
                    }
                }
                flush()
                continuation.finish()
            } catch {
                continuation.finish(throwing: error)
            }
        }
        continuation.onTermination = { _ in task.cancel() }
    }
}
