package com.dertet.harness

import android.app.Application
import android.content.Context
import com.dertet.harness.data.db.AppDatabase
import com.dertet.harness.data.settings.SettingsRepository
import com.dertet.harness.repository.ChatRepository
import com.dertet.harness.repository.MemoryRepository
import com.dertet.harness.util.wrapWithStoredLocale

class AppContainer(app: Application) {
    val appContext: Context = app.applicationContext
    val database: AppDatabase = AppDatabase.get(app)
    val settingsRepository: SettingsRepository = SettingsRepository(app)
    val chatRepository: ChatRepository = ChatRepository(database)
    val memoryRepository: MemoryRepository = MemoryRepository(database)
}

class DertetHarnessApp : Application() {
    val container: AppContainer by lazy { AppContainer(this) }

    override fun attachBaseContext(base: Context) {
        super.attachBaseContext(base.wrapWithStoredLocale())
    }
}
