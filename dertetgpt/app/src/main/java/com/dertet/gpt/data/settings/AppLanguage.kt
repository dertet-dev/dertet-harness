package com.dertet.gpt.data.settings

enum class AppLanguage(val tag: String?, val nativeName: String) {
    SYSTEM(null, "Системна"),
    UKRAINIAN("uk", "Українська"),
    ENGLISH("en", "English"),
    RUSSIAN("ru", "Русский"),
    PORTUGUESE("pt", "Português"),
    POLISH("pl", "Polski"),
    KAZAKH("kk", "Қазақша"),
    ROMANIAN("ro", "Română"),
    GERMAN("de", "Deutsch"),
    FRENCH("fr", "Français");

    companion object {
        fun fromTag(tag: String?): AppLanguage = entries.find { it.tag == tag } ?: SYSTEM
    }
}
