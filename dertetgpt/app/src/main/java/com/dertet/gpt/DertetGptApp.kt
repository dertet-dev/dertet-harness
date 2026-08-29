package com.dertet.gpt

import android.app.Application
import android.content.Context
import com.dertet.gpt.data.db.AppDatabase
import com.dertet.gpt.data.settings.SettingsRepository
import com.dertet.gpt.repository.ChatRepository
import com.dertet.gpt.repository.MemoryRepository
import com.dertet.gpt.util.wrapWithStoredLocale

class AppContainer(app: Application) {
    val appContext: Context = app.applicationContext
    val database: AppDatabase = AppDatabase.get(app)
    val settingsRepository: SettingsRepository = SettingsRepository(app)
    val chatRepository: ChatRepository = ChatRepository(database)
    val memoryRepository: MemoryRepository = MemoryRepository(database)
}

class DertetGptApp : Application() {
    val container: AppContainer by lazy { AppContainer(this) }

    override fun attachBaseContext(base: Context) {
        super.attachBaseContext(base.wrapWithStoredLocale())
    }
}
