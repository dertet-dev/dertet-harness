import Foundation
import SwiftData
import Combine

private let rememberRegex = try! NSRegularExpression(
    pattern: "\\[\\[REMEMBER:\\s*(.+?)\\s*]]",
    options: [.dotMatchesLineSeparators]
)

private let memoryInstruction = "If you learn a durable fact about the user worth " +
    "remembering for future conversations (name, preferences, occupation, ongoing context, etc.), " +
    "append a line at the very end of your reply in the exact format [[REMEMBER: fact in a short " +
    "sentence]] — it will be hidden from the user and stored for you to see next time. Only do this " +
    "for genuinely useful, durable facts, not every message."

@MainActor
final class ChatViewModel: ObservableObject {
    private let context: ModelContext
    private let settings = SettingsStore.shared

    @Published var chats: [ChatRecord] = []
    @Published var currentChatId: String?
    @Published var messages: [UiMessage] = []
    @Published var isSending: Bool = false
    @Published var pendingAttachments: [Attachment] = []
    @Published var inputText: String = ""
    @Published var errorEvent: String?

    private var streamingMessageId: String?
    private var streamingText: String = ""
    private var sendTask: Task<Void, Never>?

    init(context: ModelContext = PersistenceController.sharedContext) {
        self.context = context
        refreshChats()
    }

    func refreshChats() {
        let descriptor = FetchDescriptor<ChatRecord>(sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        chats = (try? context.fetch(descriptor)) ?? []
    }

    private func loadMessages(chatId: String) {
        let descriptor = FetchDescriptor<MessageRecord>(
            predicate: #Predicate { $0.chatId == chatId },
            sortBy: [SortDescriptor(\.createdAt, order: .forward)]
        )
        let records = (try? context.fetch(descriptor)) ?? []
        var ui = records.map { UiMessage(id: $0.id, role: $0.role, content: $0.content, attachments: $0.attachments, isError: $0.isError) }
        if let sid = streamingMessageId {
            if let idx = ui.firstIndex(where: { $0.id == sid }) {
                ui[idx].content = streamingText
                ui[idx].isStreaming = true
            } else {
                ui.append(UiMessage(id: sid, role: "assistant", content: streamingText, isStreaming: true))
            }
        }
        messages = ui
    }

    func selectChat(_ id: String) {
        guard !isSending else { return }
        currentChatId = id
        loadMessages(chatId: id)
    }

    func startNewChat() {
        guard !isSending else { return }
        currentChatId = nil
        messages = []
        pendingAttachments = []
        inputText = ""
    }

    func deleteChat(_ id: String) {
        let descriptor = FetchDescriptor<MessageRecord>(predicate: #Predicate { $0.chatId == id })
        if let msgs = try? context.fetch(descriptor) {
            for m in msgs { context.delete(m) }
        }
        if let chat = chats.first(where: { $0.id == id }) {
            context.delete(chat)
        }
        try? context.save()
        if currentChatId == id {
            currentChatId = nil
            messages = []
        }
        refreshChats()
    }

    func addAttachment(_ attachment: Attachment) {
        pendingAttachments.append(attachment)
    }

    func removeAttachment(_ attachment: Attachment) {
        pendingAttachments.removeAll { $0.id == attachment.id }
    }

    private func buildEffectiveSystemPrompt(_ settings: ProviderSettings) async -> String {
        let base = Lf("system_prompt_base", settings.model, settings.provider.displayName)
        let memories = (try? context.fetch(FetchDescriptor<MemoryRecord>(sortBy: [SortDescriptor(\.createdAt)]))) ?? []
        var memorySection = ""
        if !memories.isEmpty {
            memorySection = "\n\nWhat you know about the user so far:\n" + memories.map { "- \($0.content)" }.joined(separator: "\n")
        }
        var parts = [base + memorySection, memoryInstruction]
        if !settings.systemPrompt.isEmpty { parts.append(settings.systemPrompt) }
        return parts.joined(separator: "\n\n")
    }

    private func extractAndStripMemories(_ text: String) -> String {
        let ns = text as NSString
        let matches = rememberRegex.matches(in: text, range: NSRange(location: 0, length: ns.length))
        guard !matches.isEmpty else { return text }
        for match in matches where match.numberOfRanges > 1 {
            let fact = ns.substring(with: match.range(at: 1)).trimmingCharacters(in: .whitespacesAndNewlines)
            if !fact.isEmpty {
                let record = MemoryRecord(content: fact, source: "ai")
                context.insert(record)
            }
        }
        try? context.save()
        let stripped = rememberRegex.stringByReplacingMatches(in: text, range: NSRange(location: 0, length: ns.length), withTemplate: "")
        return stripped.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func stripForDisplay(_ text: String) -> String {
        let ns = text as NSString
        let cleaned = rememberRegex.stringByReplacingMatches(in: text, range: NSRange(location: 0, length: ns.length), withTemplate: "")
        if let range = cleaned.range(of: "[[REMEMBER", options: .backwards) {
            return String(cleaned[cleaned.startIndex..<range.lowerBound]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return cleaned
    }

    func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        let attachments = pendingAttachments
        guard !text.isEmpty || !attachments.isEmpty, !isSending else { return }

        let providerSettings = settings.currentSettings
        guard !providerSettings.apiKey.isEmpty else {
            errorEvent = "no_key"
            return
        }
        if providerSettings.provider.editableBaseUrl && providerSettings.baseUrl.isEmpty {
            errorEvent = "no_key"
            return
        }

        inputText = ""
        pendingAttachments = []

        sendTask = Task { [weak self] in
            guard let self else { return }

            var chatId = self.currentChatId
            if chatId == nil {
                let title = String((text.isEmpty ? (attachments.first?.fileName ?? L("new_chat")) : text).prefix(48))
                let chat = ChatRecord(title: title, providerId: providerSettings.provider.id, model: providerSettings.model)
                self.context.insert(chat)
                try? self.context.save()
                chatId = chat.id
                self.currentChatId = chat.id
                self.refreshChats()
            }
            guard let chatId else { return }

            let userMsg = MessageRecord(
                chatId: chatId,
                role: "user",
                content: text,
                attachmentsJSON: encodeAttachments(attachments)
            )
            self.context.insert(userMsg)
            if let chat = self.chats.first(where: { $0.id == chatId }) { chat.updatedAt = .now }
            try? self.context.save()
            self.refreshChats()
            self.loadMessages(chatId: chatId)

            let historyDescriptor = FetchDescriptor<MessageRecord>(
                predicate: #Predicate { $0.chatId == chatId },
                sortBy: [SortDescriptor(\.createdAt, order: .forward)]
            )
            let historyRecords = (try? self.context.fetch(historyDescriptor)) ?? []
            let history = historyRecords.map { ChatMessage(role: $0.role, text: $0.content, attachments: $0.attachments) }

            let assistantId = UUID().uuidString
            self.streamingMessageId = assistantId
            self.streamingText = ""
            self.isSending = true
            self.messages.append(UiMessage(id: assistantId, role: "assistant", content: "", isStreaming: true))

            var buffer = ""
            var errorMessage: String?
            let client = ClientFactory.client(for: providerSettings.provider.apiStyle)
            let systemPrompt = await self.buildEffectiveSystemPrompt(providerSettings)

            do {
                let stream = client.streamChat(
                    baseUrl: providerSettings.baseUrl,
                    apiKey: providerSettings.apiKey,
                    model: providerSettings.model,
                    systemPrompt: systemPrompt,
                    history: history
                )
                for try await event in stream {
                    if Task.isCancelled { break }
                    switch event {
                    case .delta(let chunk):
                        buffer += chunk
                        let display = self.stripForDisplay(buffer)
                        self.streamingText = display
                        if let idx = self.messages.firstIndex(where: { $0.id == assistantId }) {
                            self.messages[idx].content = display
                        }
                    case .error(let message):
                        errorMessage = message
                    case .done:
                        break
                    }
                }
            } catch {
                if buffer.isEmpty { errorMessage = error.localizedDescription }
            }

            if Task.isCancelled { return }

            let finalText = self.extractAndStripMemories(buffer)
            let isError = finalText.isEmpty && errorMessage != nil
            let assistantMsg = MessageRecord(
                id: assistantId,
                chatId: chatId,
                role: "assistant",
                content: isError ? (errorMessage ?? "Error") : finalText,
                isError: isError
            )
            self.context.insert(assistantMsg)
            if let chat = self.chats.first(where: { $0.id == chatId }) { chat.updatedAt = .now }
            try? self.context.save()

            self.streamingMessageId = nil
            self.streamingText = ""
            self.isSending = false
            self.refreshChats()
            self.loadMessages(chatId: chatId)
        }
    }

    func stopGenerating() {
        sendTask?.cancel()
        sendTask = nil
        guard let chatId = currentChatId, let sid = streamingMessageId else {
            isSending = false
            return
        }
        let content = streamingText.isEmpty ? L("stopped_response_placeholder") : streamingText
        let msg = MessageRecord(id: sid, chatId: chatId, role: "assistant", content: content)
        context.insert(msg)
        if let chat = chats.first(where: { $0.id == chatId }) { chat.updatedAt = .now }
        try? context.save()
        streamingMessageId = nil
        streamingText = ""
        isSending = false
        refreshChats()
        loadMessages(chatId: chatId)
    }
}
