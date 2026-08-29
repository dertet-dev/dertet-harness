package com.dertet.gpt.util

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

private const val PREFS_NAME = "locale_prefs"
private const val KEY_LOCALE = "app_locale"

object LocalePrefs {
    fun getTag(context: Context): String? =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_LOCALE, null)

    fun setTag(context: Context, tag: String?) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putString(KEY_LOCALE, tag).apply()
    }
}

fun Context.wrapWithStoredLocale(): Context {
    val tag = LocalePrefs.getTag(this) ?: return this
    val locale = Locale.forLanguageTag(tag)
    Locale.setDefault(locale)
    val config = Configuration(resources.configuration)
    config.setLocale(locale)
    return createConfigurationContext(config)
}
