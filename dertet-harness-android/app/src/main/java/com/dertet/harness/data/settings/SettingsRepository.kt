package com.dertet.harness.data.settings

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "secure_settings")

data class ProviderSettings(
    val provider: ProviderType,
    val apiKey: String,
    val model: String,
    val baseUrl: String,
    val systemPrompt: String
)

class SettingsRepository(private val context: Context) {

    private object Keys {
        val SELECTED_PROVIDER = stringPreferencesKey("selected_provider")
        val SYSTEM_PROMPT = stringPreferencesKey("system_prompt")
        fun apiKey(providerId: String) = stringPreferencesKey("api_key_$providerId")
        fun model(providerId: String) = stringPreferencesKey("model_$providerId")
        fun baseUrl(providerId: String) = stringPreferencesKey("base_url_$providerId")
    }

    val selectedProviderFlow: Flow<ProviderType> = context.dataStore.data.map {
        ProviderType.fromId(it[Keys.SELECTED_PROVIDER])
    }

    suspend fun setSelectedProvider(provider: ProviderType) {
        context.dataStore.edit { it[Keys.SELECTED_PROVIDER] = provider.id }
    }

    fun currentSettingsFlow(): Flow<ProviderSettings> = context.dataStore.data.map { prefs ->
        val provider = ProviderType.fromId(prefs[Keys.SELECTED_PROVIDER])
        ProviderSettings(
            provider = provider,
            apiKey = prefs[Keys.apiKey(provider.id)] ?: "",
            model = prefs[Keys.model(provider.id)] ?: provider.defaultModel,
            baseUrl = prefs[Keys.baseUrl(provider.id)] ?: provider.defaultBaseUrl,
            systemPrompt = prefs[Keys.SYSTEM_PROMPT] ?: ""
        )
    }

    suspend fun getSettingsFor(provider: ProviderType): ProviderSettings {
        val prefs = context.dataStore.data.first()
        return ProviderSettings(
            provider = provider,
            apiKey = prefs[Keys.apiKey(provider.id)] ?: "",
            model = prefs[Keys.model(provider.id)] ?: provider.defaultModel,
            baseUrl = prefs[Keys.baseUrl(provider.id)] ?: provider.defaultBaseUrl,
            systemPrompt = prefs[Keys.SYSTEM_PROMPT] ?: ""
        )
    }

    suspend fun saveProviderConfig(provider: ProviderType, apiKey: String, model: String, baseUrl: String) {
        context.dataStore.edit {
            it[Keys.apiKey(provider.id)] = apiKey
            it[Keys.model(provider.id)] = model
            it[Keys.baseUrl(provider.id)] = baseUrl
            it[Keys.SELECTED_PROVIDER] = provider.id
        }
    }

    suspend fun saveSystemPrompt(prompt: String) {
        context.dataStore.edit { it[Keys.SYSTEM_PROMPT] = prompt }
    }
}
