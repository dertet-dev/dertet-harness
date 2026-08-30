package com.dertet.harness.repository

import com.dertet.harness.data.db.AppDatabase
import com.dertet.harness.data.db.MemoryEntity
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class MemoryRepository(private val db: AppDatabase) {
    private val memoryDao = db.memoryDao()

    fun observeAll(): Flow<List<MemoryEntity>> = memoryDao.observeAll()

    suspend fun getAllOnce(): List<MemoryEntity> = memoryDao.getAllOnce()

    suspend fun add(content: String, source: String) {
        if (content.isBlank()) return
        memoryDao.insert(
            MemoryEntity(
                id = UUID.randomUUID().toString(),
                content = content.trim(),
                source = source,
                createdAt = System.currentTimeMillis()
            )
        )
    }

    suspend fun delete(id: String) {
        memoryDao.deleteById(id)
    }

    suspend fun clearAll() {
        memoryDao.deleteAll()
    }
}
