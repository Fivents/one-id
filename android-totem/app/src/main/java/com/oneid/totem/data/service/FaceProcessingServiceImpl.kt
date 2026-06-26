package com.oneid.totem.data.service

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import android.util.Log
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
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.io.RandomAccessFile
import javax.inject.Inject
import javax.inject.Singleton
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OnnxValue
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession

@Singleton
class FaceProcessingServiceImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val modelDownloader: ModelDownloader,
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
        onStatus: ((String) -> Unit)?,
    ): FaceDetectionResult? = withContext(Dispatchers.Default) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            onStatus?.invoke("ERRO: imagem nula da câmera")
            Log.w("FACE", "detectAndProcess: mediaImage is null")
            imageProxy.close()
            return@withContext null
        }

        onStatus?.invoke("Processando frame...")
        val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        val faces: List<Face>? = try {
            faceDetector.awaitProcess(inputImage)
        } catch (e: Exception) {
            Log.e("FACE", "ML Kit face detection threw", e)
            onStatus?.invoke("ERRO ML Kit: ${e.message?.take(60)}")
            null
        }
        if (faces == null) {
            imageProxy.close()
            return@withContext null
        }

        if (faces.isEmpty()) {
            onStatus?.invoke("Nenhum rosto detectado pelo ML Kit")
            imageProxy.close()
            return@withContext null
        }

        if (faces.size > config.maxFaces) {
            onStatus?.invoke("Muitos rostos (${faces.size})")
            imageProxy.close()
            return@withContext null
        }

        val face = faces[0]
        val box = face.boundingBox

        if (box.width() < config.minFaceSize || box.height() < config.minFaceSize) {
            onStatus?.invoke("Rosto muito pequeno (${box.width()}x${box.height()} < ${config.minFaceSize})")
            imageProxy.close()
            return@withContext null
        }

        onStatus?.invoke("Rosto detectado! Verificando liveness...")
        val liveness = checkLiveness(face, config)
        val landmarks = extractLandmarks(face)

        if (config.livenessEnabled && !liveness.passed) {
            val scorePercent = (liveness.score * 100).toInt()
            onStatus?.invoke("Liveness: $scorePercent% (abaixo do threshold)")
            imageProxy.close()
            return@withContext FaceDetectionResult(
                embedding = emptyList(),
                boundingBox = BoundingBox(box.left, box.top, box.width(), box.height()),
                landmarks = landmarks,
                livenessResult = liveness,
            )
        }

        onStatus?.invoke("Extraindo bitmap...")
        val fullBitmap = imageProxy.toBitmap()
        imageProxy.close()

        if (fullBitmap == null) {
            onStatus?.invoke("ERRO: conversão bitmap falhou")
            Log.w("FACE", "detectAndProcess: bitmap conversion returned null")
            return@withContext null
        }

        onStatus?.invoke("Alinhando rosto...")
        val croppedFace = if (landmarks != null) {
            ImagePreprocessor.alignAndCropFace(fullBitmap, landmarks.leftEye, landmarks.rightEye)
        } else {
            ImagePreprocessor.centerCrop(fullBitmap)
        }

        onStatus?.invoke("Gerando embedding facial (ONNX)...")
        val embedding = extractEmbedding(croppedFace, onStatus)

        if (embedding.isEmpty()) {
            onStatus?.invoke("ERRO: embedding vazio após ONNX")
            Log.w("FACE", "detectAndProcess: embedding is empty after extraction")
            return@withContext null
        }

        onStatus?.invoke("SUCESSO! ${embedding.size} dimensões extraídas")
        Log.d("FACE", "detectAndProcess: SUCCESS, embedding=${embedding.size} dims")
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
        val headAngleOk = kotlin.math.abs(face.headEulerAngleZ) < 25f

        val score = when {
            config.livenessEnabled -> {
                eyeScore * 0.5 + (if (hasValidLandmarks) 0.3 else 0.0) + (if (headAngleOk) 0.2 else 0.0)
            }
            else -> 1.0
        }

        val blinkDetected = leftEyeOpen < 0.3f || rightEyeOpen < 0.3f
        val passed = !config.livenessEnabled || score >= config.livenessThreshold

        return LivenessResult(passed = passed, score = score, blinkDetected = blinkDetected)
    }

    override suspend fun extractEmbedding(croppedFace: Bitmap, onStatus: ((String) -> Unit)?): List<Double> {
        val loaded = ensureModelLoaded(onStatus)
        if (!loaded) {
            onStatus?.invoke("Modelo ONNX não carregado")
            return emptyList()
        }

        onStatus?.invoke("Pré-processando bitmap para ONNX...")
        val inputArray = ImagePreprocessor.toFloatArray(croppedFace)

        return withContext(Dispatchers.Default) {
            try {
                val shape = longArrayOf(1, 3, 112, 112)
                val floatBuffer = java.nio.FloatBuffer.wrap(inputArray)
                onStatus?.invoke("Criando tensor ONNX...")
                val tensor = OnnxTensor.createTensor(ortEnvironment, floatBuffer, shape)

                onStatus?.invoke("Rodando inferência (input='$INPUT_NAME' -> output='$OUTPUT_NAME')...")
                val output = ortSession?.run(mapOf(INPUT_NAME to tensor))
                val onnxValue = output?.get(OUTPUT_NAME)
                when (onnxValue) {
                    is OnnxTensor -> {
                        val fb = onnxValue.floatBuffer
                        val floats = FloatArray(fb.remaining()).also { fb.get(it) }
                        tensor.close()
                        output?.close()
                        onStatus?.invoke("Embedding ${floats.size} dims extraído com sucesso")
                        floats.toList().map { it.toDouble() }
                    }
                    else -> {
                        val actualType = onnxValue?.javaClass?.name ?: "null"
                        onStatus?.invoke("Tipo inesperado: $actualType (esperado OnnxTensor)")
                        tensor.close()
                        output?.close()
                        emptyList()
                    }
                }
            } catch (e: Exception) {
                onStatus?.invoke("ERRO ONNX: ${e.message?.take(80)}")
                Log.e("FACE", "extractEmbedding: ONNX inference failed", e)
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

    private suspend fun ensureModelLoaded(onStatus: ((String) -> Unit)? = null): Boolean {
        if (modelLoaded) return true
        onStatus?.invoke("Carregando modelo ONNX...")
        return try {
            val result = modelDownloader.downloadIfNeeded()
            if (result.isFailure) {
                val errMsg = result.exceptionOrNull()?.message ?: "erro desconhecido"
                onStatus?.invoke("ERRO download modelo: $errMsg")
                return false
            }

            val modelFile = result.getOrNull() ?: return false
            onStatus?.invoke("Arquivo modelo OK (${modelFile.length() / 1024 / 1024}MB), criando sessão ONNX...")
            val mappedBuffer = RandomAccessFile(modelFile, "r").use { raf ->
                val channel = raf.channel
                channel.map(FileChannel.MapMode.READ_ONLY, 0, modelFile.length())
            }
            ortSession = ortEnvironment.createSession(mappedBuffer)
            modelLoaded = true
            onStatus?.invoke("Sessão ONNX criada com sucesso")
            true
        } catch (e: Exception) {
            onStatus?.invoke("ERRO sessão ONNX: ${e.message?.take(80)}")
            Log.e("FACE", "ensureModelLoaded: ONNX session creation failed", e)
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

    companion object {
        private const val INPUT_NAME = "input.1"
        private const val OUTPUT_NAME = "fc1"
    }
}

private suspend fun com.google.mlkit.vision.face.FaceDetector.awaitProcess(image: InputImage): List<Face> {
    return kotlinx.coroutines.suspendCancellableCoroutine { cont ->
        val task = process(image)
        task.addOnSuccessListener { faces -> cont.resume(faces, null) }
            .addOnFailureListener { cont.resume(emptyList(), null) }
    }
}
