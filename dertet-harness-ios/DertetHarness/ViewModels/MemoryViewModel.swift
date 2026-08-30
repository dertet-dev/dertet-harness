import Foundation
import SwiftData

@MainActor
final class MemoryViewModel: ObservableObject {
    private let context: ModelContext
    @Published var memories: [MemoryRecord] = []

    init(context: ModelContext = PersistenceController.sharedContext) {
        self.context = context
        refresh()
    }

    func refresh() {
        let descriptor = FetchDescriptor<MemoryRecord>(sortBy: [SortDescriptor(\.createdAt, order: .reverse)])
        memories = (try? context.fetch(descriptor)) ?? []
    }

    func addManual(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        context.insert(MemoryRecord(content: trimmed, source: "user"))
        try? context.save()
        refresh()
    }

    func delete(_ record: MemoryRecord) {
        context.delete(record)
        try? context.save()
        refresh()
    }

    func clearAll() {
        for m in memories { context.delete(m) }
        try? context.save()
        refresh()
    }
}
