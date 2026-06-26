# PostgreSQL JDBC
-keep class org.postgresql.** { *; }
-keep class org.postgresql.util.** { *; }
-keep class org.postgresql.ssl.** { *; }
-keep class org.postgresql.core.** { *; }
-keep class org.postgresql.ds.** { *; }
-keepclassmembers class org.postgresql.** { *; }

# PostgreSQL JDBC references classes not available on Android:
-dontwarn javax.naming.**
-dontwarn javax.security.**
-dontwarn javax.sql.**
-dontwarn javax.transaction.**
-dontwarn javax.xml.**
-dontwarn org.ietf.jgss.**
-dontwarn org.osgi.**
-dontwarn waffle.**
-dontwarn java.lang.management.**
-dontwarn java.sql.SQLType
-dontwarn com.sun.jna.**
-dontwarn java.awt.**
-dontwarn edu.umd.cs.findbugs.annotations.**

# ONNX Runtime (inclui classes nativas JNI)
-keep class ai.onnxruntime.** { *; }
-keep class ai.onnxruntime.providers.** { *; }
-keepclassmembers class ai.onnxruntime.** { *; }

# Brother Print SDK
-keep class com.brother.** { *; }
-keep class com.brother.sdk.lmprinter.** { *; }
-keepclassmembers class com.brother.sdk.lmprinter.** { *; }

# ML Kit
-keep class com.google.mlkit.** { *; }
-keepclassmembers class com.google.mlkit.** { *; }

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$FragmentContextWrapper { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$ActivityContextWrapper { *; }

# Hilt-generated components
-keep class * extends dagger.hilt.android.internal.builders.** { *; }
-keep class * extends dagger.hilt.components.** { *; }
-keep class com.oneid.totem.**Factory { *; }
-keep class com.oneid.totem.**Component { *; }
-keep class com.oneid.totem.**ComponentC { *; }

# Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** { *; }

# Kotlin stdlib (reflection, serialization)
-keep class kotlin.Metadata { *; }
-keep class kotlin.reflect.** { *; }
-keep class kotlin.jvm.internal.** { *; }

# Database models (acessados via reflection no JDBC)
-keep class com.oneid.totem.data.db.** { *; }
-keep class com.oneid.totem.domain.model.** { *; }

# BuildConfig
-keep class com.oneid.totem.BuildConfig { *; }
