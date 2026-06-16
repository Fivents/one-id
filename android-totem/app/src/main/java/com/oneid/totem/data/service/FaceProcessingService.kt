package com.oneid.totem.data.service

import android.graphics.Bitmap
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.face.Face
import com.oneid.totem.domain.model.FaceDetectionResult
import com.oneid.totem.domain.model.FaceProcessingConfig
import com.oneid.totem.domain.model.LivenessResult

interface FaceProcessingService {
    @ExperimentalGetImage
    suspend fun detectAndProcess(
        imageProxy: ImageProxy,
        config: FaceProcessingConfig = FaceProcessingConfig(),
    ): FaceDetectionResult?

    fun checkLiveness(face: Face, config: FaceProcessingConfig): LivenessResult

    suspend fun extractEmbedding(croppedFace: Bitmap): List<Double>

    fun close()
}
