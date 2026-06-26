package com.oneid.totem.data.service

import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.oneid.totem.domain.model.FaceDetectionResult
import com.oneid.totem.domain.model.FaceProcessingConfig
import kotlinx.coroutines.*

class CameraFaceAnalyzer(
    private val faceProcessingService: FaceProcessingService,
    private val config: FaceProcessingConfig = FaceProcessingConfig(),
    private val onFaceResult: (FaceDetectionResult?) -> Unit,
    private val onStatus: ((String) -> Unit)? = null,
) : ImageAnalysis.Analyzer {

    private var processing = false
    private var lastProcessedMs = 0L
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    @OptIn(ExperimentalGetImage::class)
    override fun analyze(imageProxy: ImageProxy) {
        val now = System.currentTimeMillis()
        if (processing || (now - lastProcessedMs) < config.cooldownMs) {
            imageProxy.close()
            return
        }

        processing = true
        lastProcessedMs = now
        onStatus?.invoke("Frame recebido, processando...")

        scope.launch {
            try {
                val result = faceProcessingService.detectAndProcess(imageProxy, config, onStatus)
                onFaceResult(result)
            } catch (e: Exception) {
                onStatus?.invoke("ERRO: ${e.message?.take(60)}")
                imageProxy.close()
            } finally {
                processing = false
            }
        }
    }

    fun stop() {
        scope.cancel()
    }
}
