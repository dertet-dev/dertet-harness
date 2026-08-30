package com.dertet.harness.ui

import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel as composeViewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.dertet.harness.AppContainer
import com.dertet.harness.ui.components.DrawerContent
import com.dertet.harness.ui.screens.ChatScreen
import com.dertet.harness.ui.screens.MemoryScreen
import com.dertet.harness.ui.screens.SettingsScreen
import kotlinx.coroutines.launch

private enum class Screen { CHAT, SETTINGS, MEMORY }

@Composable
fun AppRoot(container: AppContainer) {
    val chatViewModel: ChatViewModel = composeViewModel(
        factory = viewModelFactory { initializer { ChatViewModel(container) } }
    )
    val settingsViewModel: SettingsViewModel = composeViewModel(
        factory = viewModelFactory { initializer { SettingsViewModel(container) } }
    )
    val memoryViewModel: MemoryViewModel = composeViewModel(
        factory = viewModelFactory { initializer { MemoryViewModel(container) } }
    )

    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var screen by remember { mutableStateOf(Screen.CHAT) }

    val chats by chatViewModel.chats.collectAsState()
    val currentChatId by chatViewModel.currentChatId.collectAsState()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                DrawerContent(
                    chats = chats,
                    currentChatId = currentChatId,
                    onNewChat = {
                        chatViewModel.startNewChat()
                        screen = Screen.CHAT
                        scope.launch { drawerState.close() }
                    },
                    onSelectChat = { id ->
                        chatViewModel.selectChat(id)
                        screen = Screen.CHAT
                        scope.launch { drawerState.close() }
                    },
                    onDeleteChat = { chatViewModel.deleteChat(it) },
                    onOpenSettings = {
                        screen = Screen.SETTINGS
                        scope.launch { drawerState.close() }
                    }
                )
            }
        }
    ) {
        when (screen) {
            Screen.SETTINGS -> SettingsScreen(
                viewModel = settingsViewModel,
                onBack = { screen = Screen.CHAT },
                onOpenMemory = { screen = Screen.MEMORY }
            )
            Screen.MEMORY -> MemoryScreen(
                viewModel = memoryViewModel,
                onBack = { screen = Screen.SETTINGS }
            )
            Screen.CHAT -> ChatScreen(
                viewModel = chatViewModel,
                onOpenDrawer = { scope.launch { drawerState.open() } },
                onOpenSettings = { screen = Screen.SETTINGS }
            )
        }
    }
}
