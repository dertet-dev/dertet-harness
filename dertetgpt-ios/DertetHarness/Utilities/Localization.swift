import Foundation
import Combine

final class LocalizationManager: ObservableObject {
    static let shared = LocalizationManager()

    @Published var language: AppLanguage {
        didSet { UserDefaults.standard.set(language.rawValue, forKey: "app_language") }
    }

    private init() {
        let stored = UserDefaults.standard.string(forKey: "app_language")
        self.language = AppLanguage(rawValue: stored ?? "") ?? .system
    }

    var effectiveCode: String {
        if let code = language.languageCode { return code }
        let preferred = Locale.preferredLanguages.first.map { String($0.prefix(2)) } ?? "uk"
        return Translations.table[preferred] != nil ? preferred : "uk"
    }

    func t(_ key: String) -> String {
        Translations.table[effectiveCode]?[key] ?? Translations.table["uk"]?[key] ?? key
    }
}

/// Shorthand localized lookup.
func L(_ key: String) -> String {
    LocalizationManager.shared.t(key)
}

/// Localized lookup with String(format:)-style %@ arguments.
func Lf(_ key: String, _ args: CVarArg...) -> String {
    String(format: L(key), arguments: args)
}
