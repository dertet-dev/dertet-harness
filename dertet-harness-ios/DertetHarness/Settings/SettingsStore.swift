import Foundation
import Combine

struct ProviderSettings {
    var provider: ProviderType
    var apiKey: String
    var model: String
    var baseUrl: String
    var systemPrompt: String
}

final class SettingsStore: ObservableObject {
    static let shared = SettingsStore()
    private let defaults = UserDefaults.standard

    @Published var selectedProvider: ProviderType {
        didSet { defaults.set(selectedProvider.rawValue, forKey: Keys.selectedProvider) }
    }
    @Published var systemPrompt: String {
        didSet { defaults.set(systemPrompt, forKey: Keys.systemPrompt) }
    }

    private enum Keys {
        static let selectedProvider = "selected_provider"
        static let systemPrompt = "system_prompt"
        static func apiKey(_ id: String) -> String { "api_key_\(id)" }
        static func model(_ id: String) -> String { "model_\(id)" }
        static func baseUrl(_ id: String) -> String { "base_url_\(id)" }
    }

    private init() {
        let providerId = defaults.string(forKey: Keys.selectedProvider) ?? ProviderType.openrouter.rawValue
        self.selectedProvider = ProviderType(rawValue: providerId) ?? .openrouter
        self.systemPrompt = defaults.string(forKey: Keys.systemPrompt) ?? ""
    }

    func apiKey(for provider: ProviderType) -> String {
        defaults.string(forKey: Keys.apiKey(provider.id)) ?? ""
    }

    func model(for provider: ProviderType) -> String {
        defaults.string(forKey: Keys.model(provider.id)) ?? provider.defaultModel
    }

    func baseUrl(for provider: ProviderType) -> String {
        defaults.string(forKey: Keys.baseUrl(provider.id)) ?? provider.defaultBaseUrl
    }

    func saveProviderConfig(provider: ProviderType, apiKey: String, model: String, baseUrl: String) {
        defaults.set(apiKey, forKey: Keys.apiKey(provider.id))
        defaults.set(model.isEmpty ? provider.defaultModel : model, forKey: Keys.model(provider.id))
        defaults.set(baseUrl.isEmpty ? provider.defaultBaseUrl : baseUrl, forKey: Keys.baseUrl(provider.id))
        selectedProvider = provider
    }

    var currentSettings: ProviderSettings {
        ProviderSettings(
            provider: selectedProvider,
            apiKey: apiKey(for: selectedProvider),
            model: model(for: selectedProvider),
            baseUrl: baseUrl(for: selectedProvider),
            systemPrompt: systemPrompt
        )
    }

    func settings(for provider: ProviderType) -> ProviderSettings {
        ProviderSettings(
            provider: provider,
            apiKey: apiKey(for: provider),
            model: model(for: provider),
            baseUrl: baseUrl(for: provider),
            systemPrompt: systemPrompt
        )
    }
}
