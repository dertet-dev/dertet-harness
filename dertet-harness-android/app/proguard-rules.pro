# Keep kotlinx.serialization models
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keep,includedescriptorclasses class com.dertet.gpt.**$$serializer { *; }
-keepclassmembers class com.dertet.gpt.** {
    *** Companion;
}
-keepclasseswithmembers class com.dertet.gpt.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep class com.dertet.gpt.network.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
