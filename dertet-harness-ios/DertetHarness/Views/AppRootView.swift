import SwiftUI
import UIKit

private enum Screen {
    case chat, settings, memory
}

extension UIApplication {
    func dismissKeyboard() {
        sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

struct AppRootView: View {
    @ObservedObject private var loc = LocalizationManager.shared
    @StateObject private var chatViewModel = ChatViewModel()
    @StateObject private var settingsViewModel = SettingsViewModel()
    @StateObject private var memoryViewModel = MemoryViewModel()

    @State private var screen: Screen = .chat
    @State private var drawerOpen = false

    private let drawerWidth: CGFloat = 300

    var body: some View {
        ZStack(alignment: .leading) {
                Group {
                    switch screen {
                    case .chat:
                        ChatView(
                            viewModel: chatViewModel,
                            onOpenDrawer: {
                                UIApplication.shared.dismissKeyboard()
                                withAnimation(.easeInOut(duration: 0.25)) { drawerOpen = true }
                            }
                        )
                    case .settings:
                        SettingsView(
                            viewModel: settingsViewModel,
                            onBack: { screen = .chat },
                            onOpenMemory: { screen = .memory }
                        )
                    case .memory:
                        MemoryView(viewModel: memoryViewModel, onBack: { screen = .settings })
                    }
                }
                .disabled(drawerOpen)

                if drawerOpen {
                    Color.black.opacity(0.45)
                        .ignoresSafeArea()
                        .onTapGesture { withAnimation(.easeInOut(duration: 0.25)) { drawerOpen = false } }
                        .transition(.opacity)
                }

                DrawerView(
                    chats: chatViewModel.chats,
                    currentChatId: chatViewModel.currentChatId,
                    onNewChat: {
                        chatViewModel.startNewChat()
                        screen = .chat
                        withAnimation(.easeInOut(duration: 0.25)) { drawerOpen = false }
                    },
                    onSelectChat: { id in
                        chatViewModel.selectChat(id)
                        screen = .chat
                        withAnimation(.easeInOut(duration: 0.25)) { drawerOpen = false }
                    },
                    onDeleteChat: { chatViewModel.deleteChat($0) },
                    onOpenSettings: {
                        screen = .settings
                        withAnimation(.easeInOut(duration: 0.25)) { drawerOpen = false }
                    }
                )
                .frame(width: drawerWidth)
                .background(Theme.background)
                .offset(x: drawerOpen ? 0 : -drawerWidth)
                .animation(.easeInOut(duration: 0.25), value: drawerOpen)
        }
        .background(Theme.background)
        .id(loc.language)
    }
}
