package com.dertet.harness.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dertet.harness.AppContainer
import com.dertet.harness.data.settings.ProviderType
import com.dertet.harness.network.fetchAvailableModels
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class SettingsViewModel(private val container: AppContainer) : ViewModel() {
    private val settingsRepo = container.settingsRepository

    var selectedProvider by mutableStateOf(ProviderType.OPENROUTER)
        private set
    var apiKey by mutableStateOf("")
    var model by mutableStateOf("")
    var baseUrl by mutableStateOf("")
    var systemPrompt by mutableStateOf("")
    var justSaved by mutableStateOf(false)
    var loaded by mutableStateOf(false)
        private set
    var availableModels by mutableStateOf<List<String>>(emptyList())
        private set
    var modelsLoading by mutableStateOf(false)
        private set

    private var modelsJob: Job? = null

    init {
        viewModelScope.launch {
            val current = settingsRepo.currentSettingsFlow().first()
            selectedProvider = current.provider
            apiKey = current.apiKey
            model = current.model.ifBlank { current.provider.defaultModel }
            baseUrl = current.baseUrl.ifBlank { current.provider.defaultBaseUrl }
            systemPrompt = current.systemPrompt
            loaded = true
            refreshModels()
        }
    }

    fun onProviderSelected(provider: ProviderType) {
        if (provider == selectedProvider) return
        selectedProvider = provider
        justSaved = false
        availableModels = emptyList()
        viewModelScope.launch {
            val s = settingsRepo.getSettingsFor(provider)
            apiKey = s.apiKey
            model = s.model.ifBlank { provider.defaultModel }
            baseUrl = s.baseUrl.ifBlank { provider.defaultBaseUrl }
            refreshModels()
        }
    }

    fun refreshModels() {
        modelsJob?.cancel()
        modelsJob = viewModelScope.launch {
            modelsLoading = true
            availableModels = fetchAvailableModels(selectedProvider.apiStyle, baseUrl, apiKey)
            modelsLoading = false
        }
    }

    fun save() {
        viewModelScope.launch {
            settingsRepo.saveProviderConfig(
                provider = selectedProvider,
                apiKey = apiKey.trim(),
                model = model.trim().ifBlank { selectedProvider.defaultModel },
                baseUrl = baseUrl.trim().ifBlank { selectedProvider.defaultBaseUrl }
            )
            settingsRepo.saveSystemPrompt(systemPrompt.trim())
            justSaved = true
        }
    }
}
