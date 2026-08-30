import Foundation

enum ModelsAPI {
    static func fetchAvailableModels(style: ApiStyle, baseUrl: String, apiKey: String) async -> [String] {
        do {
            switch style {
            case .openAICompatible: return try await fetchOpenAIStyle(baseUrl: baseUrl, apiKey: apiKey)
            case .anthropic: return try await fetchAnthropic(baseUrl: baseUrl, apiKey: apiKey)
            case .gemini: return try await fetchGemini(baseUrl: baseUrl, apiKey: apiKey)
            }
        } catch {
            return []
        }
    }

    private static func fetchOpenAIStyle(baseUrl: String, apiKey: String) async throws -> [String] {
        guard !baseUrl.isEmpty, let url = URL(string: baseUrl.trimmedTrailingSlash + "/models") else { return [] }
        var request = URLRequest(url: url)
        if !apiKey.isEmpty { request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization") }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else { return [] }
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let list = asArray(obj["data"]) else { return [] }
        return list.compactMap { asString(asDict($0)?["id"]) }.sorted()
    }

    private static func fetchAnthropic(baseUrl: String, apiKey: String) async throws -> [String] {
        guard !apiKey.isEmpty, let url = URL(string: baseUrl.trimmedTrailingSlash + "/models?limit=1000") else { return [] }
        var request = URLRequest(url: url)
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else { return [] }
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let list = asArray(obj["data"]) else { return [] }
        return list.compactMap { asString(asDict($0)?["id"]) }.sorted()
    }

    private static func fetchGemini(baseUrl: String, apiKey: String) async throws -> [String] {
        guard !apiKey.isEmpty, let url = URL(string: baseUrl.trimmedTrailingSlash + "/models?pageSize=1000") else { return [] }
        var request = URLRequest(url: url)
        request.setValue(apiKey, forHTTPHeaderField: "x-goog-api-key")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else { return [] }
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let list = asArray(obj["models"]) else { return [] }
        return list.compactMap { entry -> String? in
            guard let dict = asDict(entry), let name = asString(dict["name"]) else { return nil }
            let methods = asArray(dict["supportedGenerationMethods"])?.compactMap { $0 as? String } ?? []
            let supportsChat = methods.isEmpty || methods.contains("generateContent") || methods.contains("streamGenerateContent")
            guard supportsChat else { return nil }
            return name.hasPrefix("models/") ? String(name.dropFirst("models/".count)) : name
        }.sorted()
    }
}
