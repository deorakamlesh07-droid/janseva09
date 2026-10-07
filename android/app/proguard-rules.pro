# Ward Mitra 44 — ProGuard Rules

# Keep Capacitor core and all plugins
-keep class com.getcapacitor.** { *; }
-keep class com.ward44.bikaner.** { *; }

# Keep WebView JavaScript interface bridge methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep plugin annotations
-keepattributes *Annotation*
-keepattributes JavascriptInterface

# OkHttp / networking (used internally by Capacitor)
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# Preserve line numbers in crash stack traces for easier debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Suppress warnings for missing optional classes
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
