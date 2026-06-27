package com.oneid.totem.data.print

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

data class BadgeElements(
    val participantName: String,
    val company: String?,
    val jobTitle: String?,
    val qrCodeValue: String?,
    val accessCode: String?,
    val showQrCode: Boolean = true,
    val showAccessCode: Boolean = false,
    val eventName: String = "",
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
        showQrCode: Boolean = true,
        showAccessCode: Boolean = false,
        eventName: String = "",
        paperWidthMm: Double,
        paperHeightMm: Double,
        dpi: Int,
    ): Bitmap = withContext(Dispatchers.Default) {
        val rollWidthMm = paperHeightMm
        val maxFeedMm = paperWidthMm

        val rollWidthPx = mmToPixels(rollWidthMm, dpi)
        val maxFeedPx = mmToPixels(maxFeedMm, dpi)

        val bitmap = Bitmap.createBitmap(rollWidthPx, maxFeedPx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)

        drawBadge(
            canvas = canvas,
            elements = BadgeElements(
                participantName = shortenName(name),
                company = company,
                jobTitle = jobTitle,
                qrCodeValue = qrCodeValue,
                accessCode = accessCode,
                showQrCode = showQrCode,
                showAccessCode = showAccessCode,
                eventName = eventName,
            ),
            widthPx = rollWidthPx,
            heightPx = maxFeedPx,
            dpi = dpi,
        )

        trimBitmap(bitmap, mmToPixels(2.0, dpi))
    }

    private fun shortenName(fullName: String): String {
        val parts = fullName.trim().split("\\s+".toRegex())
        if (parts.size <= 2) return fullName
        return "${parts.first()} ${parts.last()}"
    }

    private fun drawBadge(
        canvas: Canvas,
        elements: BadgeElements,
        widthPx: Int,
        heightPx: Int,
        dpi: Int,
    ) {
        val m = mmToPixels(2.5, dpi)
        val showQr = elements.showQrCode && !elements.qrCodeValue.isNullOrBlank()
        val cssScale = dpi / 96f * 2.2f

        val brandPaint = Paint().apply {
            color = Color.BLACK
            textSize = 6f * cssScale
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            isAntiAlias = true
        }
        val namePaint = Paint().apply {
            color = Color.BLACK
            textSize = 13f * cssScale
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            isAntiAlias = true
        }
        val metaPaint = Paint().apply {
            color = Color.BLACK
            textSize = 9f * cssScale
            typeface = Typeface.create("sans-serif", Typeface.NORMAL)
            isAntiAlias = true
        }
        val tsPaint = Paint().apply {
            color = Color.BLACK
            textSize = 4f * cssScale
            typeface = Typeface.create("sans-serif", Typeface.NORMAL)
            isAntiAlias = true
        }
        val codeLabelPaint = Paint().apply {
            color = Color.BLACK
            textSize = 3.5f * cssScale
            typeface = Typeface.create("sans-serif", Typeface.NORMAL)
            isAntiAlias = true
        }
        val codeValuePaint = Paint().apply {
            color = Color.BLACK
            textSize = 5f * cssScale
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            isAntiAlias = true
        }
        val sepPaint = Paint().apply {
            color = Color.BLACK
            strokeWidth = mmToPixels(0.5, dpi).toFloat()
        }

        val gapTight = mmToPixels(0.6, dpi).toFloat()
        val gapBig = mmToPixels(2.0, dpi).toFloat()
        val sepH = mmToPixels(0.6, dpi).toFloat()
        val hasTitle = !elements.jobTitle.isNullOrBlank()
        val hasCompany = !elements.company.isNullOrBlank()
        val textL = m.toFloat()
        val fullW = widthPx - m * 2

        // QR code no canto superior direito
        val qrMargin = mmToPixels(1.0, dpi).coerceAtLeast(3)
        val qrSize: Int
        val qrZoneBottom: Float
        if (showQr) {
            qrSize = mmToPixels(18.0, dpi).coerceIn(80, (widthPx * 0.35f).toInt())
            val qrX = widthPx - qrSize - qrMargin
            val qrY = qrMargin
            drawQrCode(canvas, elements.qrCodeValue!!, qrX, qrY, qrSize)
            qrZoneBottom = (qrY + qrSize + gapTight).toFloat()
        } else {
            qrSize = 0
            qrZoneBottom = 0f
        }

        // Espaço à esquerda do QR para o header
        val headerW = if (showQr) (widthPx - qrSize - qrMargin - m) else fullW

        var y = m.toFloat()

        val headerText = if (elements.eventName.isNotBlank()) "ONEID - ${elements.eventName.uppercase()}" else "ONEID"
        y = drawTextAt(canvas, headerText, brandPaint, textL, y + brandPaint.textSize)

        // Pula para depois do QR (só header divide a linha com QR)
        y = maxOf(y, qrZoneBottom) + gapTight

        y = drawTextWrappedMax(canvas, elements.participantName, namePaint, textL, y + namePaint.textSize, fullW, 2)

        if (hasTitle) {
            y += gapTight
            y = drawTextWrappedMax(canvas, elements.jobTitle!!, metaPaint, textL, y + metaPaint.textSize, fullW, 2)
        }

        if (hasCompany) {
            y += gapTight
            y = drawTextWrappedMax(canvas, elements.company!!, metaPaint, textL, y + metaPaint.textSize, fullW, 2)
        }

        y += gapTight
        canvas.drawLine(textL, y, (textL + fullW).toFloat(), y, sepPaint)
        y += sepH + gapTight

        val timestamp = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
        y = drawTextAt(canvas, timestamp, tsPaint, textL, y + tsPaint.textSize)

        if (elements.showAccessCode && !elements.accessCode.isNullOrBlank()) {
            val label = "Codigo: "
            val labelW = codeLabelPaint.measureText(label)
            drawTextAt(canvas, label, codeLabelPaint, textL, y + codeValuePaint.textSize)
            drawTextAt(canvas, elements.accessCode, codeValuePaint, textL + labelW, y + codeValuePaint.textSize)
        }
    }

    private fun trimBitmap(bitmap: Bitmap, marginPx: Int): Bitmap {
        val w = bitmap.width
        val h = bitmap.height

        var top = 0
        var bottom = h - 1

        topLoop@ for (y in 0 until h) {
            for (x in 0 until w) {
                if (bitmap.getPixel(x, y) != Color.WHITE) {
                    top = y
                    break@topLoop
                }
            }
        }

        if (top >= bottom) return bitmap

        bottomLoop@ for (y in (h - 1) downTo 0) {
            for (x in 0 until w) {
                if (bitmap.getPixel(x, y) != Color.WHITE) {
                    bottom = y
                    break@bottomLoop
                }
            }
        }

        val cropTop = (top - marginPx).coerceAtLeast(0)
        val cropBottom = (bottom + marginPx).coerceAtMost(h - 1)
        val cropH = cropBottom - cropTop + 1

        if (cropTop == 0 && cropBottom == h - 1) return bitmap
        return Bitmap.createBitmap(bitmap, 0, cropTop, w, cropH)
    }

    private fun drawTextAt(
        canvas: Canvas,
        text: String,
        paint: Paint,
        x: Float,
        y: Float,
    ): Float {
        canvas.drawText(text, x, y, paint)
        return y
    }

    private fun drawTextWrappedMax(
        canvas: Canvas,
        text: String,
        paint: Paint,
        x: Float,
        y: Float,
        maxWidth: Int,
        maxLines: Int,
    ): Float {
        val lines = autoWrap(text, paint, maxWidth)
        var currentY = y
        for (i in 0 until minOf(lines.size, maxLines)) {
            val line = if (i == maxLines - 1 && lines.size > maxLines) {
                truncateLine(lines[i], paint, maxWidth)
            } else {
                lines[i]
            }
            canvas.drawText(line, x, currentY, paint)
            currentY += paint.textSize * 1.15f
        }
        return currentY
    }

    private fun truncateLine(line: String, paint: Paint, maxWidth: Int): String {
        val ellipsis = "..."
        if (paint.measureText(line) <= maxWidth) return line
        var result = line
        while (result.isNotEmpty() && paint.measureText("$result$ellipsis") > maxWidth) {
            result = result.dropLast(1)
        }
        return "$result$ellipsis"
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
            val bitMatrix = writer.encode(value, BarcodeFormat.QR_CODE, size, size)
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
            participantName = shortenName(name ?: ""),
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
