import Foundation
import Combine

@MainActor
final class SettingsViewModel: ObservableObject {
    private let store = SettingsStore.shared

    @Published var selectedProvider: ProviderType
    @Published var apiKey: String = ""
    @Published var model: String = ""
    @Published var baseUrl: String = ""
    @Published var systemPrompt: String = ""
    @Published var justSaved: Bool = false
    @Published var availableModels: [String] = []
    @Published var modelsLoading: Bool = false

    private var modelsTask: Task<Void, Never>?

    init() {
        let current = store.currentSettings
        self.selectedProvider = current.provider
        self.apiKey = current.apiKey
        self.model = current.model
        self.baseUrl = current.baseUrl
        self.systemPrompt = current.systemPrompt
        refreshModels()
    }

    func onProviderSelected(_ provider: ProviderType) {
        guard provider != selectedProvider else { return }
        selectedProvider = provider
        justSaved = false
        availableModels = []
        let s = store.settings(for: provider)
        apiKey = s.apiKey
        model = s.model
        baseUrl = s.baseUrl
        refreshModels()
    }

    func refreshModels() {
        modelsTask?.cancel()
        let provider = selectedProvider
        let key = apiKey
        let url = baseUrl
        modelsLoading = true
        modelsTask = Task { [weak self] in
            let models = await ModelsAPI.fetchAvailableModels(style: provider.apiStyle, baseUrl: url, apiKey: key)
            guard let self, !Task.isCancelled else { return }
            self.availableModels = models
            self.modelsLoading = false
        }
    }

    func save() {
        let finalModel = model.trimmingCharacters(in: .whitespaces).isEmpty ? selectedProvider.defaultModel : model
        let finalBaseUrl = baseUrl.trimmingCharacters(in: .whitespaces).isEmpty ? selectedProvider.defaultBaseUrl : baseUrl
        store.saveProviderConfig(
            provider: selectedProvider,
            apiKey: apiKey.trimmingCharacters(in: .whitespaces),
            model: finalModel,
            baseUrl: finalBaseUrl
        )
        store.systemPrompt = systemPrompt.trimmingCharacters(in: .whitespaces)
        justSaved = true
    }
}
