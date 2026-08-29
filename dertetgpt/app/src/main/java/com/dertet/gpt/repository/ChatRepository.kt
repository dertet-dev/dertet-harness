package com.dertet.gpt.repository

import com.dertet.gpt.data.db.AppDatabase
import com.dertet.gpt.data.db.ChatEntity
import com.dertet.gpt.data.db.MessageEntity
import com.dertet.gpt.data.settings.ApiStyle
import com.dertet.gpt.network.ChatMessage
import com.dertet.gpt.network.ChatStreamEvent
import com.dertet.gpt.network.ClientFactory
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class ChatRepository(private val db: AppDatabase) {
    private val chatDao = db.chatDao()
    private val messageDao = db.messageDao()

    fun observeChats(): Flow<List<ChatEntity>> = chatDao.observeAll()
    fun observeMessages(chatId: String): Flow<List<MessageEntity>> = messageDao.observeForChat(chatId)

    suspend fun getChat(chatId: String): ChatEntity? = chatDao.getById(chatId)

    suspend fun createChat(providerId: String, model: String, title: String = "Новий чат"): ChatEntity {
        val now = System.currentTimeMillis()
        val chat = ChatEntity(
            id = UUID.randomUUID().toString(),
            title = title,
            providerId = providerId,
            model = model,
            createdAt = now,
            updatedAt = now
        )
        chatDao.insert(chat)
        return chat
    }

    suspend fun touchChat(chatId: String) {
        val chat = chatDao.getById(chatId) ?: return
        chatDao.update(chat.copy(updatedAt = System.currentTimeMillis()))
    }

    suspend fun renameChat(chatId: String, title: String) {
        chatDao.renameChat(chatId, title, System.currentTimeMillis())
    }

    suspend fun deleteChat(chatId: String) {
        messageDao.deleteForChat(chatId)
        chatDao.deleteById(chatId)
    }

    suspend fun insertMessage(message: MessageEntity) {
        messageDao.insert(message)
    }

    suspend fun updateMessage(message: MessageEntity) {
        messageDao.update(message)
    }

    suspend fun deleteMessage(id: String) {
        messageDao.deleteById(id)
    }

    /** Deletes [messageId] and every message after it in the same chat (used when editing a message). */
    suspend fun deleteMessagesFrom(chatId: String, messageId: String) {
        val target = messageDao.getById(messageId) ?: return
        messageDao.deleteFromTimestamp(chatId, target.createdAt)
    }

    suspend fun getMessagesOnce(chatId: String): List<MessageEntity> = messageDao.getForChatOnce(chatId)

    fun streamAssistantReply(
        apiStyle: ApiStyle,
        baseUrl: String,
        apiKey: String,
        model: String,
        systemPrompt: String,
        history: List<ChatMessage>
    ): Flow<ChatStreamEvent> {
        return ClientFactory.forStyle(apiStyle).streamChat(baseUrl, apiKey, model, systemPrompt, history)
    }
}
