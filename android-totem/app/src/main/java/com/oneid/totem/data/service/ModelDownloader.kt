package com.oneid.totem.data.service

import android.content.Context
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

sealed class ModelDownloadState {
    data object NotStarted : ModelDownloadState()
    data object Checking : ModelDownloadState()
    data class Progress(val percent: Float) : ModelDownloadState()
    data object Ready : ModelDownloadState()
    data class Error(val message: String) : ModelDownloadState()
}

@Singleton
class ModelDownloader @Inject constructor(
    @ApplicationContext private val context: Context,
) {

    private val modelDir: File
        get() = File(context.filesDir, "models").also { it.mkdirs() }

    val modelFile: File
        get() = File(modelDir, MODEL_FILENAME)

    private val modelUrl: String by lazy { resolveModelUrl() }

    private val _downloadState = MutableStateFlow<ModelDownloadState>(ModelDownloadState.NotStarted)
    val downloadState: StateFlow<ModelDownloadState> = _downloadState.asStateFlow()

    private val downloadMutex = Mutex()

    fun isModelDownloaded(): Boolean = modelFile.exists() && modelFile.length() > 0

    suspend fun downloadIfNeeded(): Result<File> {
        return downloadMutex.withLock {
            val currentState = _downloadState.value
            when {
                currentState is ModelDownloadState.Ready -> {
                    Result.success(modelFile)
                }
                currentState is ModelDownloadState.Progress -> {
                    downloadModel()
                }
                isModelDownloaded() -> {
                    _downloadState.value = ModelDownloadState.Ready
                    Result.success(modelFile)
                }
                else -> {
                    _downloadState.value = ModelDownloadState.Progress(0f)
                    downloadModel()
                }
            }
        }
    }

    private suspend fun downloadModel(): Result<File> {
        return withContext(Dispatchers.IO) {
            try {
                modelFile.deleteSilently()

                val url = URL(modelUrl)
                val connection = (url.openConnection() as HttpURLConnection).apply {
                    connectTimeout = 30_000
                    readTimeout = 120_000
                    setRequestProperty("User-Agent", "OneID-Totem/1.0")
                }

                val contentLength = connection.contentLengthLong
                val inputStream = connection.inputStream
                val outputStream = FileOutputStream(modelFile)

                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalBytesRead = 0L

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                    totalBytesRead += bytesRead
                    if (contentLength > 0) {
                        val progress = totalBytesRead.toFloat() / contentLength.toFloat()
                        _downloadState.value = ModelDownloadState.Progress(progress.coerceIn(0f, 1f))
                    }
                }

                outputStream.close()
                inputStream.close()
                connection.disconnect()

                if (!modelFile.exists() || modelFile.length() == 0L) {
                    _downloadState.value = ModelDownloadState.Error("Arquivo vazio ou ausente")
                    Result.failure(Exception("Download failed - file empty or missing"))
                } else {
                    _downloadState.value = ModelDownloadState.Ready
                    Log.d("MODEL", "Download concluido: ${modelFile.length()} bytes")
                    Result.success(modelFile)
                }
            } catch (e: Exception) {
                Log.e("MODEL", "Erro no download do modelo", e)
                modelFile.deleteSilently()
                _downloadState.value = ModelDownloadState.Error(e.message ?: "Erro desconhecido")
                Result.failure(e)
            }
        }
    }

    fun deleteModel() {
        modelFile.deleteSilently()
        _downloadState.value = ModelDownloadState.NotStarted
    }

    private fun File.deleteSilently() {
        try {
            if (exists()) delete()
        } catch (_: Exception) { }
    }

    private fun resolveModelUrl(): String {
        return try {
            com.oneid.totem.BuildConfig.MODEL_DOWNLOAD_URL.ifBlank {
                Log.w("MODEL", "MODEL_DOWNLOAD_URL vazio, usando fallback")
                FALLBACK_URL
            }
        } catch (e: Exception) {
            Log.e("MODEL", "Nao foi possivel ler BuildConfig.MODEL_DOWNLOAD_URL", e)
            FALLBACK_URL
        }
    }

    companion object {
        private const val MODEL_FILENAME = "arcface.onnx"
        private const val FALLBACK_URL = "https://huggingface.co/onnx-community/arcface-onnx/resolve/main/arcface.onnx"
    }
}
