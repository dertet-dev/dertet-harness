import Foundation
import SwiftData

enum PersistenceController {
    static let sharedContainer: ModelContainer = {
        let schema = Schema([ChatRecord.self, MessageRecord.self, MemoryRecord.self])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }()

    /// A single shared context used by all ViewModels. `ModelContext.init(_:)` is a plain
    /// nonisolated initializer (unlike `ModelContainer.mainContext`, which is `@MainActor`-isolated
    /// and unsafe to reference from a View's property-initializer default-argument position),
    /// so this is safe to use as a default parameter value anywhere.
    static let sharedContext: ModelContext = ModelContext(sharedContainer)
}
