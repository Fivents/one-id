package com.oneid.totem.data.service

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.compose.ui.geometry.Offset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object ImagePreprocessor {

    private const val FACE_INPUT_SIZE = 112

    suspend fun alignAndCropFace(
        source: Bitmap,
        leftEye: Pair<Float, Float>,
        rightEye: Pair<Float, Float>,
    ): Bitmap = withContext(Dispatchers.Default) {
        val eyeCenter = Offset(
            (leftEye.first + rightEye.first) / 2f,
            (leftEye.second + rightEye.second) / 2f,
        )

        val dy = rightEye.second - leftEye.second
        val dx = rightEye.first - leftEye.first
        val angle = Math.toDegrees(Math.atan2(dy.toDouble(), dx.toDouble())).toFloat()

        val desiredDist = 48.0f
        val scale = desiredDist / hypot(dx, dy)

        val matrix = Matrix().apply {
            postTranslate(-eyeCenter.x, -eyeCenter.y)
            postRotate(-angle)
            postScale(scale, scale)
            postTranslate(FACE_INPUT_SIZE / 2f, FACE_INPUT_SIZE * 0.4f)
        }

        Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true).let { rotated ->
            val cropX = maxOf(0, (rotated.width - FACE_INPUT_SIZE) / 2)
            val cropY = maxOf(0, (rotated.height - FACE_INPUT_SIZE) / 2)
            val cropW = minOf(FACE_INPUT_SIZE, rotated.width)
            val cropH = minOf(FACE_INPUT_SIZE, rotated.height)
            if (cropW >= FACE_INPUT_SIZE && cropH >= FACE_INPUT_SIZE) {
                Bitmap.createBitmap(rotated, cropX, cropY, FACE_INPUT_SIZE, FACE_INPUT_SIZE)
            } else {
                Bitmap.createScaledBitmap(rotated, FACE_INPUT_SIZE, FACE_INPUT_SIZE, true)
            }
        }
    }

    suspend fun centerCrop(source: Bitmap): Bitmap = withContext(Dispatchers.Default) {
        val size = minOf(source.width, source.height)
        val x = (source.width - size) / 2
        val y = (source.height - size) / 2
        val cropped = Bitmap.createBitmap(source, x, y, size, size)
        Bitmap.createScaledBitmap(cropped, FACE_INPUT_SIZE, FACE_INPUT_SIZE, true)
    }

    suspend fun toFloatArray(bitmap: Bitmap): FloatArray = withContext(Dispatchers.Default) {
        val w = bitmap.width
        val h = bitmap.height
        val pixels = IntArray(w * h)
        bitmap.getPixels(pixels, 0, w, 0, 0, w, h)

        val input = FloatArray(3 * w * h)
        for (i in pixels.indices) {
            val pixel = pixels[i]
            val r = ((pixel shr 16) and 0xFF) / 127.5f - 1.0f
            val g = ((pixel shr 8) and 0xFF) / 127.5f - 1.0f
            val b = (pixel and 0xFF) / 127.5f - 1.0f
            input[i] = r
            input[i + w * h] = g
            input[i + 2 * w * h] = b
        }
        input
    }

    private fun hypot(dx: Float, dy: Float): Float {
        return kotlin.math.sqrt((dx * dx + dy * dy).toDouble()).toFloat()
    }
}
