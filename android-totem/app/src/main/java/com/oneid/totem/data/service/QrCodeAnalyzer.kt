package com.oneid.totem.data.service

import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.*

class QrCodeAnalyzer(
    private val onQrDetected: (String) -> Unit,
    private val onError: (String) -> Unit = {},
) : ImageAnalysis.Analyzer {

    private var processing = false
    private var lastDetectedValue: String = ""
    private var lastDetectedMs = 0L
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val scanner = BarcodeScanning.getClient()

    @OptIn(ExperimentalGetImage::class)
    override fun analyze(imageProxy: ImageProxy) {
        if (processing) {
            imageProxy.close()
            return
        }

        val now = System.currentTimeMillis()
        if (now - lastDetectedMs < 3000) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return
        }

        processing = true

        scope.launch {
            try {
                val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                val barcodes = scanner.awaitScan(inputImage)

                for (barcode in barcodes) {
                    val value = barcode.rawValue ?: continue
                    if (value != lastDetectedValue || (now - lastDetectedMs) > 5000) {
                        lastDetectedValue = value
                        lastDetectedMs = now
                        onQrDetected(value)
                    }
                    break
                }
            } catch (e: Exception) {
                onError(e.message ?: "Erro ao ler QR Code")
            } finally {
                processing = false
                imageProxy.close()
            }
        }
    }

    fun stop() {
        scope.cancel()
        scanner.close()
    }
}

private suspend fun com.google.mlkit.vision.barcode.BarcodeScanner.awaitScan(image: InputImage): List<Barcode> {
    return suspendCancellableCoroutine { cont ->
        val task = process(image)
        task.addOnSuccessListener { barcodes -> cont.resume(barcodes, null) }
            .addOnFailureListener { cont.resume(emptyList(), null) }
    }
}
