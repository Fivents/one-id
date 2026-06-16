# Moshi - keep @JsonClass annotated classes
-keepclassmembers class com.oneid.totem.data.api.dto.** { *; }
-keep class com.oneid.totem.data.api.dto.** { *; }
-keep class com.squareup.moshi.** { *; }

# ONNX Runtime
-keep class ai.onnxruntime.** { *; }

# Brother Print SDK
-keep class com.brother.** { *; }
-keep class com.brother.sdk.lmprinter.** { *; }
-keepclassmembers class com.brother.sdk.lmprinter.** { *; }

# ML Kit
-keep class com.google.mlkit.** { *; }

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }

# Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
