package com.oneid.totem.data.print

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.Rect
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.common.BitMatrix
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

data class BadgeElements(
    val participantName: String,
    val company: String?,
    val jobTitle: String?,
    val qrCodeValue: String?,
    val accessCode: String?,
) {
    fun isNotEmpty(): Boolean = participantName.isNotBlank()
}

@Singleton
class BadgeRenderer @Inject constructor() {

    suspend fun render(
        html: String,
        paperWidthMm: Double,
        paperHeightMm: Double,
        dpi: Int,
    ): Bitmap = withContext(Dispatchers.Default) {
        val widthPx = mmToPixels(paperWidthMm, dpi)
        val heightPx = mmToPixels(paperHeightMm, dpi)

        val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)

        val elements = parseHtmlToElements(html)
        if (elements.isNotEmpty()) {
            drawBadge(canvas, elements, widthPx, heightPx, dpi)
        }

        bitmap
    }

    suspend fun renderFromData(
        name: String,
        company: String?,
        jobTitle: String?,
        qrCodeValue: String?,
        accessCode: String?,
        paperWidthMm: Double,
        paperHeightMm: Double,
        dpi: Int,
    ): Bitmap = withContext(Dispatchers.Default) {
        val widthPx = mmToPixels(paperWidthMm, dpi)
        val heightPx = mmToPixels(paperHeightMm, dpi)

        val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)

        drawBadge(
            canvas = canvas,
            elements = BadgeElements(name, company, jobTitle, qrCodeValue, accessCode),
            widthPx = widthPx,
            heightPx = heightPx,
            dpi = dpi,
        )

        bitmap
    }

    private fun drawBadge(
        canvas: Canvas,
        elements: BadgeElements,
        widthPx: Int,
        heightPx: Int,
        dpi: Int,
    ) {
        val marginPx = mmToPixels(3.0, dpi)
        val contentWidth = widthPx - marginPx * 2
        var currentY = marginPx.toFloat()

        val namePaint = Paint().apply {
            color = Color.BLACK
            textSize = (contentWidth / 12f).coerceIn(24f, 72f)
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            isAntiAlias = true
        }

        val metaPaint = Paint().apply {
            color = Color.DKGRAY
            textSize = (contentWidth / 16f).coerceIn(16f, 48f)
            typeface = Typeface.create("sans-serif", Typeface.NORMAL)
            isAntiAlias = true
        }

        currentY = drawTextCentered(canvas, elements.participantName, namePaint, widthPx, currentY + namePaint.textSize * 1.2f)

        if (!elements.jobTitle.isNullOrBlank()) {
            currentY += metaPaint.textSize * 0.3f
            currentY = drawTextCentered(canvas, elements.jobTitle, metaPaint, widthPx, currentY + metaPaint.textSize)
        }

        if (!elements.company.isNullOrBlank()) {
            metaPaint.textSize = (contentWidth / 18f).coerceIn(14f, 36f)
            currentY += metaPaint.textSize * 0.2f
            currentY = drawTextCentered(canvas, elements.company, metaPaint, widthPx, currentY + metaPaint.textSize)
        }

        if (!elements.accessCode.isNullOrBlank()) {
            val codePaint = Paint().apply {
                color = Color.DKGRAY
                textSize = (contentWidth / 20f).coerceIn(12f, 32f)
                typeface = Typeface.create("sans-serif", Typeface.NORMAL)
                isAntiAlias = true
            }
            currentY += codePaint.textSize * 0.5f
            currentY = drawTextCentered(canvas, "Código: ${elements.accessCode}", codePaint, widthPx, currentY + codePaint.textSize)
        }

        val qrSize = ((heightPx - currentY - marginPx).coerceAtMost(contentWidth.coerceAtMost(400).toFloat())).toInt()
        if (!elements.qrCodeValue.isNullOrBlank() && qrSize > 30) {
            val qrX = (widthPx - qrSize) / 2
            val qrY = (currentY + marginPx).coerceAtLeast(marginPx.toFloat()).toInt()
            drawQrCode(canvas, elements.qrCodeValue, qrX, qrY, qrSize)
        }
    }

    private fun drawTextCentered(
        canvas: Canvas,
        text: String,
        paint: Paint,
        canvasWidth: Int,
        y: Float,
    ): Float {
        val lines = autoWrap(text, paint, canvasWidth)
        var currentY = y
        for (line in lines) {
            val textWidth = paint.measureText(line)
            val x = (canvasWidth - textWidth) / 2f
            canvas.drawText(line, x, currentY, paint)
            currentY += paint.textSize * 1.15f
        }
        return currentY
    }

    private fun autoWrap(text: String, paint: Paint, maxWidth: Int): List<String> {
        if (paint.measureText(text) <= maxWidth) return listOf(text)

        val lines = mutableListOf<String>()
        val words = text.split(" ")
        val currentLine = StringBuilder()
        for (word in words) {
            val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
            if (paint.measureText(testLine) <= maxWidth) {
                currentLine.append(if (currentLine.isEmpty()) word else " $word")
            } else {
                if (currentLine.isNotEmpty()) lines.add(currentLine.toString())
                currentLine.clear()
                currentLine.append(word)
            }
        }
        if (currentLine.isNotEmpty()) lines.add(currentLine.toString())
        return lines
    }

    private fun drawQrCode(canvas: Canvas, value: String, x: Int, y: Int, size: Int) {
        try {
            val writer = QRCodeWriter()
            val bitMatrix: BitMatrix = writer.encode(value, BarcodeFormat.QR_CODE, size, size)
            val paint = Paint().apply { color = Color.BLACK }
            val whitePaint = Paint().apply { color = Color.WHITE }

            canvas.drawRect(x.toFloat(), y.toFloat(), (x + size).toFloat(), (y + size).toFloat(), whitePaint)

            val moduleSize = size.toFloat() / bitMatrix.width
            for (row in 0 until bitMatrix.height) {
                for (col in 0 until bitMatrix.width) {
                    if (bitMatrix[col, row]) {
                        val left = x + col * moduleSize
                        val top = y + row * moduleSize
                        canvas.drawRect(left, top, left + moduleSize, top + moduleSize, paint)
                    }
                }
            }
        } catch (e: Exception) {
            val paint = Paint().apply {
                color = Color.RED
                textSize = 24f
            }
            canvas.drawText("QR Error", x.toFloat(), (y + size / 2).toFloat(), paint)
        }
    }

    private fun parseHtmlToElements(html: String): BadgeElements {
        val name = extractText(html, listOf("participantName", "name", "Nome"))
        val company = extractText(html, listOf("company", "Company", "empresa", "Empresa"))
        val jobTitle = extractText(html, listOf("jobTitle", "job_title", "cargo", "Cargo"))
        val qrCode = extractText(html, listOf("qrCodeValue", "qrcode", "qr"))
        val code = extractText(html, listOf("accessCode", "access_code", "codigo"))
        return BadgeElements(
            participantName = name ?: "",
            company = company,
            jobTitle = jobTitle,
            qrCodeValue = qrCode,
            accessCode = code,
        )
    }

    private fun extractText(html: String, possibleIds: List<String>): String? {
        for (id in possibleIds) {
            val regex = Regex("""(?:id|class)["'\s]*=.*?["']\s*$id\s*["'][^>]*>(.*?)</""", RegexOption.IGNORE_CASE)
            val match = regex.find(html)
            if (match != null) {
                val text = match.groupValues[1]
                    .replace(Regex("<[^>]+>"), "")
                    .trim()
                if (text.isNotBlank()) return text
            }
        }
        return null
    }

    companion object {
        fun mmToPixels(mm: Double, dpi: Int): Int {
            return (mm / 25.4 * dpi).toInt().coerceAtLeast(1)
        }
    }
}
