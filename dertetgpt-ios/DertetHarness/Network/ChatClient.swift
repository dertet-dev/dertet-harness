import Foundation

protocol ChatClient {
    func streamChat(
        baseUrl: String,
        apiKey: String,
        model: String,
        systemPrompt: String,
        history: [ChatMessage]
    ) -> AsyncThrowingStream<ChatStreamEvent, Error>
}

enum ClientFactory {
    private static let openAI = OpenAICompatibleClient()
    private static let anthropic = AnthropicClient()
    private static let gemini = GeminiClient()

    static func client(for style: ApiStyle) -> ChatClient {
        switch style {
        case .openAICompatible: return openAI
        case .anthropic: return anthropic
        case .gemini: return gemini
        }
    }
}

func jsonString(_ object: Any) -> Data {
    (try? JSONSerialization.data(withJSONObject: object)) ?? Data()
}

func asDict(_ any: Any?) -> [String: Any]? { any as? [String: Any] }
func asArray(_ any: Any?) -> [Any]? { any as? [Any] }
func asString(_ any: Any?) -> String? { any as? String }
