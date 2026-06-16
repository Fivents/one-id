package com.oneid.totem.domain.model

data class FaceDetectionResult(
    val embedding: List<Double>,
    val boundingBox: BoundingBox,
    val landmarks: FaceLandmarks?,
    val livenessResult: LivenessResult,
)

data class BoundingBox(
    val x: Int, val y: Int, val width: Int, val height: Int,
)

data class FaceLandmarks(
    val leftEye: Pair<Float, Float>,
    val rightEye: Pair<Float, Float>,
    val noseTip: Pair<Float, Float>?,
)

data class LivenessResult(
    val passed: Boolean,
    val score: Double,
    val blinkDetected: Boolean,
)

data class FaceProcessingConfig(
    val minFaceSize: Int = 200,
    val maxFaces: Int = 1,
    val livenessEnabled: Boolean = true,
    val livenessThreshold: Double = 0.6,
    val confidenceThreshold: Double = 0.7,
    val cooldownMs: Long = 2000,
)
