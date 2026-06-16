package com.oneid.totem.data.service

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.oneid.totem.domain.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import javax.inject.Inject
import javax.inject.Singleton
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OnnxValue
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession

@Singleton
class FaceProcessingServiceImpl @Inject constructor(
    @ApplicationContext private val context: Context,
) : FaceProcessingService {

    private val ortEnvironment: OrtEnvironment by lazy { OrtEnvironment.getEnvironment() }
    private var ortSession: OrtSession? = null
    private var modelLoaded = false

    private val faceDetector by lazy {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setMinFaceSize(0.2f)
            .build()
        FaceDetection.getClient(options)
    }

    @OptIn(ExperimentalGetImage::class)
    override suspend fun detectAndProcess(
        imageProxy: ImageProxy,
        config: FaceProcessingConfig,
    ): FaceDetectionResult? = withContext(Dispatchers.Default) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return@withContext null
        }

        val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        val faces: List<Face>? = try { faceDetector.awaitProcess(inputImage) } catch (_: Exception) { null }
        if (faces == null) {
            imageProxy.close()
            return@withContext null
        }

        if (faces.isEmpty() || faces.size > config.maxFaces) {
            imageProxy.close()
            return@withContext null
        }

        val face = faces[0]
        val box = face.boundingBox

        if (box.width() < config.minFaceSize || box.height() < config.minFaceSize) {
            imageProxy.close()
            return@withContext null
        }

        val liveness = checkLiveness(face, config)
        val landmarks = extractLandmarks(face)

        if (config.livenessEnabled && !liveness.passed) {
            imageProxy.close()
            return@withContext FaceDetectionResult(
                embedding = emptyList(),
                boundingBox = BoundingBox(box.left, box.top, box.width(), box.height()),
                landmarks = landmarks,
                livenessResult = liveness,
            )
        }

        val fullBitmap = imageProxy.toBitmap()
        imageProxy.close()

        if (fullBitmap == null) return@withContext null

        val croppedFace = if (landmarks != null) {
            ImagePreprocessor.alignAndCropFace(fullBitmap, landmarks.leftEye, landmarks.rightEye)
        } else {
            ImagePreprocessor.centerCrop(fullBitmap)
        }

        val embedding = extractEmbedding(croppedFace)

        FaceDetectionResult(
            embedding = embedding,
            boundingBox = BoundingBox(box.left, box.top, box.width(), box.height()),
            landmarks = landmarks,
            livenessResult = liveness,
        )
    }

    override fun checkLiveness(face: Face, config: FaceProcessingConfig): LivenessResult {
        val leftEyeOpen = face.leftEyeOpenProbability ?: 1.0f
        val rightEyeOpen = face.rightEyeOpenProbability ?: 1.0f
        val eyeScore = ((leftEyeOpen + rightEyeOpen) / 2.0).toDouble()

        val hasValidLandmarks = face.allLandmarks.size >= 3
        val headAngleOk = kotlin.math.abs(face.headEulerAngleZ) < 15f

        val score = when {
            config.livenessEnabled -> {
                eyeScore * 0.6 + (if (hasValidLandmarks) 0.25 else 0.0) + (if (headAngleOk) 0.15 else 0.0)
            }
            else -> 1.0
        }

        val blinkDetected = leftEyeOpen < 0.3f || rightEyeOpen < 0.3f
        val passed = !config.livenessEnabled || score >= config.livenessThreshold

        return LivenessResult(passed = passed, score = score, blinkDetected = blinkDetected)
    }

    override suspend fun extractEmbedding(croppedFace: Bitmap): List<Double> {
        if (!ensureModelLoaded()) return emptyList()

        val inputArray = ImagePreprocessor.toFloatArray(croppedFace)

        return withContext(Dispatchers.Default) {
            try {
                val shape = longArrayOf(1, 3, 112, 112)
                val floatBuffer = java.nio.FloatBuffer.wrap(inputArray)
                val tensor = OnnxTensor.createTensor(ortEnvironment, floatBuffer, shape)
                val output = ortSession?.run(mapOf("data" to tensor))
                val onnxValue = output?.get("fc1")
                val embeddingArray = when (onnxValue) {
                    is OnnxTensor -> {
                        val fb = onnxValue.floatBuffer
                        val floats = FloatArray(fb.remaining()).also { fb.get(it) }
                        floats.toList().map { it.toDouble() }
                    }
                    else -> emptyList()
                }
                tensor.close()
                output?.close()
                embeddingArray
            } catch (_: Exception) {
                emptyList()
            }
        }
    }

    override fun close() {
        ortSession?.close()
        faceDetector.close()
    }

    private fun extractLandmarks(face: Face): FaceLandmarks? {
        val landmarks = face.allLandmarks
        if (landmarks.isEmpty()) return null
        val leftEye = landmarks.find { it.landmarkType == com.google.mlkit.vision.face.FaceLandmark.LEFT_EYE }?.position
        val rightEye = landmarks.find { it.landmarkType == com.google.mlkit.vision.face.FaceLandmark.RIGHT_EYE }?.position
        val noseTip = landmarks.find { it.landmarkType == com.google.mlkit.vision.face.FaceLandmark.NOSE_BASE }?.position

        if (leftEye == null || rightEye == null) return null
        return FaceLandmarks(
            leftEye = Pair(leftEye.x, leftEye.y),
            rightEye = Pair(rightEye.x, rightEye.y),
            noseTip = noseTip?.let { Pair(it.x, it.y) },
        )
    }

    @Synchronized
    private fun ensureModelLoaded(): Boolean {
        if (modelLoaded) return true
        return try {
            val modelBytes = context.assets.open("arcface_mobilefacenet.onnx").use { it.readBytes() }
            ortSession = ortEnvironment.createSession(modelBytes)
            modelLoaded = true
            true
        } catch (_: Exception) {
            modelLoaded = false
            false
        }
    }

    private fun yuv420ToYuvImage(image: android.media.Image): YuvImage {
        val yBuffer = image.planes[0].buffer
        val uBuffer = image.planes[1].buffer
        val vBuffer = image.planes[2].buffer

        val ySize = yBuffer.remaining()
        val uSize = uBuffer.remaining()
        val vSize = vBuffer.remaining()
        val totalSize = ySize + uSize + vSize

        val nv21 = ByteArray(totalSize)
        yBuffer.get(nv21, 0, ySize)

        for (i in 0 until uSize.coerceAtMost(vSize)) {
            nv21[ySize + i * 2] = vBuffer.get()
            nv21[ySize + i * 2 + 1] = uBuffer.get()
        }

        return YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)
    }

    @OptIn(ExperimentalGetImage::class)
    private fun ImageProxy.toBitmap(): Bitmap? {
        val mediaImage = image ?: return null
        return when (mediaImage.format) {
            ImageFormat.YUV_420_888 -> {
                val yuvImage = yuv420ToYuvImage(mediaImage)
                val out = ByteArrayOutputStream()
                yuvImage.compressToJpeg(Rect(0, 0, mediaImage.width, mediaImage.height), 90, out)
                val bytes = out.toByteArray()
                val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                if (bitmap != null && imageInfo.rotationDegrees != 0) {
                    val matrix = Matrix().apply { postRotate(imageInfo.rotationDegrees.toFloat()) }
                    Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                } else bitmap
            }
            else -> {
                val buffer = mediaImage.planes[0].buffer
                val bytes = ByteArray(buffer.remaining())
                buffer.get(bytes)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            }
        }
    }
}

private suspend fun com.google.mlkit.vision.face.FaceDetector.awaitProcess(image: InputImage): List<Face> {
    return kotlinx.coroutines.suspendCancellableCoroutine { cont ->
        val task = process(image)
        task.addOnSuccessListener { faces -> cont.resume(faces, null) }
            .addOnFailureListener { cont.resume(emptyList(), null) }
    }
}
