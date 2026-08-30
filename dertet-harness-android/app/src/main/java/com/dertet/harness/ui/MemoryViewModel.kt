package com.dertet.harness.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dertet.harness.AppContainer
import com.dertet.harness.data.db.MemoryEntity
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MemoryViewModel(private val container: AppContainer) : ViewModel() {
    private val repo = container.memoryRepository

    val memories: StateFlow<List<MemoryEntity>> = repo.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun addManual(text: String) {
        val trimmed = text.trim()
        if (trimmed.isBlank()) return
        viewModelScope.launch { repo.add(trimmed, "user") }
    }

    fun delete(id: String) {
        viewModelScope.launch { repo.delete(id) }
    }

    fun clearAll() {
        viewModelScope.launch { repo.clearAll() }
    }
}
