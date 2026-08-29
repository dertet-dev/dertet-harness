import SwiftUI

struct ChatView: View {
    @ObservedObject var viewModel: ChatViewModel
    let onOpenDrawer: () -> Void

    @State private var showNoKeyAlert = false

    var body: some View {
        VStack(spacing: 0) {
            header

            if viewModel.messages.isEmpty {
                Spacer()
                emptyState
                Spacer()
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 14) {
                            ForEach(viewModel.messages) { msg in
                                MessageBubbleView(message: msg)
                                    .id(msg.id)
                            }
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                    }
                    .onChange(of: viewModel.messages.count) { _, _ in
                        scrollToBottom(proxy)
                    }
                    .onChange(of: viewModel.messages.last?.content) { _, _ in
                        scrollToBottom(proxy)
                    }
                }
            }

            ChatInputBarView(
                text: $viewModel.inputText,
                attachments: viewModel.pendingAttachments,
                onRemoveAttachment: { viewModel.removeAttachment($0) },
                onAddAttachment: { viewModel.addAttachment($0) },
                isSending: viewModel.isSending,
                onSend: { viewModel.sendMessage() },
                onStop: { viewModel.stopGenerating() }
            )
        }
        .background(Theme.background)
        .onChange(of: viewModel.errorEvent) { _, newValue in
            if newValue == "no_key" {
                showNoKeyAlert = true
                viewModel.errorEvent = nil
            }
        }
        .alert(L("snackbar_no_key"), isPresented: $showNoKeyAlert) {
            Button("OK", role: .cancel) {}
        }
    }

    private var header: some View {
        HStack {
            Button(action: onOpenDrawer) {
                Image(systemName: "line.3.horizontal")
                    .foregroundColor(Theme.onBackground)
            }
            VStack(alignment: .leading, spacing: 0) {
                Text("Dertet Harness")
                    .font(.headline)
                    .foregroundColor(Theme.onBackground)
                Text(SettingsStore.shared.currentSettings.model)
                    .font(.caption)
                    .foregroundColor(Theme.onSurfaceMuted)
            }
            .padding(.leading, 8)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Theme.background)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Text(L("empty_chat_title"))
                .font(.title3.weight(.semibold))
                .foregroundColor(Theme.onBackground)
            if SettingsStore.shared.currentSettings.apiKey.isEmpty {
                Text(L("empty_chat_subtitle"))
                    .font(.subheadline)
                    .foregroundColor(Theme.onSurfaceMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
        }
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        guard let lastId = viewModel.messages.last?.id else { return }
        withAnimation {
            proxy.scrollTo(lastId, anchor: .bottom)
        }
    }
}
