import Foundation
import SwiftData

enum AttachmentKind: String, Codable {
    case image
    case file
}

struct Attachment: Codable, Identifiable, Hashable {
    var id: UUID = UUID()
    var fileName: String
    var mimeType: String
    var kind: AttachmentKind
    var base64Data: String?
    var textContent: String?

    enum CodingKeys: String, CodingKey {
        case fileName, mimeType, kind, base64Data, textContent
    }
}

@Model
final class ChatRecord {
    @Attribute(.unique) var id: String
    var title: String
    var providerId: String
    var model: String
    var createdAt: Date
    var updatedAt: Date

    init(id: String = UUID().uuidString, title: String, providerId: String, model: String, createdAt: Date = .now, updatedAt: Date = .now) {
        self.id = id
        self.title = title
        self.providerId = providerId
        self.model = model
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

@Model
final class MessageRecord {
    @Attribute(.unique) var id: String
    var chatId: String
    var role: String
    var content: String
    var attachmentsJSON: String?
    var isError: Bool
    var createdAt: Date

    init(id: String = UUID().uuidString, chatId: String, role: String, content: String, attachmentsJSON: String? = nil, isError: Bool = false, createdAt: Date = .now) {
        self.id = id
        self.chatId = chatId
        self.role = role
        self.content = content
        self.attachmentsJSON = attachmentsJSON
        self.isError = isError
        self.createdAt = createdAt
    }

    var attachments: [Attachment] {
        guard let json = attachmentsJSON, let data = json.data(using: .utf8) else { return [] }
        return (try? JSONDecoder().decode([Attachment].self, from: data)) ?? []
    }
}

@Model
final class MemoryRecord {
    @Attribute(.unique) var id: String
    var content: String
    var source: String
    var createdAt: Date

    init(id: String = UUID().uuidString, content: String, source: String, createdAt: Date = .now) {
        self.id = id
        self.content = content
        self.source = source
        self.createdAt = createdAt
    }
}

func encodeAttachments(_ attachments: [Attachment]) -> String? {
    guard !attachments.isEmpty else { return nil }
    guard let data = try? JSONEncoder().encode(attachments) else { return nil }
    return String(data: data, encoding: .utf8)
}

// MARK: - Network-facing DTOs

struct ChatMessage {
    var role: String
    var text: String
    var attachments: [Attachment] = []
}

enum ChatStreamEvent {
    case delta(String)
    case error(String)
    case done
}

struct UiMessage: Identifiable, Equatable {
    var id: String
    var role: String
    var content: String
    var attachments: [Attachment] = []
    var isError: Bool = false
    var isStreaming: Bool = false
}
