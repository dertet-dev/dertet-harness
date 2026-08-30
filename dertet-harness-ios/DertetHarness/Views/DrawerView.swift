import SwiftUI

struct DrawerView: View {
    let chats: [ChatRecord]
    let currentChatId: String?
    let onNewChat: () -> Void
    let onSelectChat: (String) -> Void
    let onDeleteChat: (String) -> Void
    let onOpenSettings: () -> Void

    @State private var pendingDeleteId: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Dertet Harness")
                .font(.title2.bold())
                .foregroundColor(Theme.onBackground)
                .padding(.horizontal, 20)
                .padding(.top, 20)

            Button(action: onNewChat) {
                HStack {
                    Image(systemName: "plus")
                        .foregroundColor(Theme.primary)
                    Text(L("new_chat"))
                        .foregroundColor(Theme.onBackground)
                        .font(.body.weight(.medium))
                    Spacer()
                }
                .padding(14)
                .background(Theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)

            Text(L("chat_history"))
                .font(.caption.weight(.medium))
                .foregroundColor(Theme.onSurfaceMuted)
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 8)

            if chats.isEmpty {
                Text(L("no_chats_yet"))
                    .foregroundColor(Theme.onSurfaceMuted)
                    .font(.subheadline)
                    .padding(.horizontal, 20)
            }

            ScrollView {
                LazyVStack(spacing: 3) {
                    ForEach(chats) { chat in
                        chatRow(chat)
                    }
                }
                .padding(.horizontal, 16)
            }

            Spacer()

            Button(action: onOpenSettings) {
                HStack {
                    Image(systemName: "gearshape")
                        .foregroundColor(Theme.onSurfaceMuted)
                    Text(L("settings"))
                        .foregroundColor(Theme.onBackground)
                        .font(.body.weight(.medium))
                    Spacer()
                }
                .padding(14)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
        }
        .confirmationDialog(
            L("action_delete"),
            isPresented: Binding(get: { pendingDeleteId != nil }, set: { if !$0 { pendingDeleteId = nil } }),
            titleVisibility: .visible
        ) {
            Button(L("action_delete"), role: .destructive) {
                if let id = pendingDeleteId { onDeleteChat(id) }
                pendingDeleteId = nil
            }
            Button(L("action_cancel"), role: .cancel) { pendingDeleteId = nil }
        }
    }

    @ViewBuilder
    private func chatRow(_ chat: ChatRecord) -> some View {
        let selected = chat.id == currentChatId
        Button(action: { onSelectChat(chat.id) }) {
            HStack {
                Image(systemName: "bubble.left")
                    .foregroundColor(Theme.onSurfaceMuted)
                Text(chat.title.isEmpty ? L("new_chat") : chat.title)
                    .foregroundColor(Theme.onBackground)
                    .lineLimit(1)
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 12)
            .background(selected ? Theme.surfaceHigh : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .simultaneousGesture(
            LongPressGesture().onEnded { _ in pendingDeleteId = chat.id }
        )
    }
}
