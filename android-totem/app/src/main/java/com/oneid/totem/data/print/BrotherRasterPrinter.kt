package com.oneid.totem.data.print

import android.graphics.Bitmap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.net.Socket
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BrotherRasterPrinter @Inject constructor() : BrotherPrinter {

    private var socket: Socket? = null
    private var outputStream: OutputStream? = null

    override suspend fun connect(ipAddress: String, port: Int): PrintJobResult {
        return withContext(Dispatchers.IO) {
            try {
                socket?.close()
                val sock = Socket(ipAddress, port)
                sock.soTimeout = 10000
                sock.keepAlive = true
                socket = sock
                outputStream = sock.getOutputStream()
                PrintJobResult.Success
            } catch (e: Exception) {
                PrintJobResult.Error("Conexão falhou: ${e.message}")
            }
        }
    }

    override suspend fun printBitmap(bitmap: Bitmap, copies: Int): PrintJobResult {
        return withContext(Dispatchers.IO) {
            try {
                val out = outputStream ?: return@withContext PrintJobResult.Error("Printer not connected")
                val rasterData = bitmapToBrotherRaster(bitmap)
                repeat(copies) {
                    out.write(rasterData)
                    out.flush()
                }
                PrintJobResult.Success
            } catch (e: Exception) {
                PrintJobResult.Error("Impressão falhou: ${e.message}")
            }
        }
    }

    override suspend fun getStatus(): PrinterStatus {
        return try {
            if (isConnected()) PrinterStatus.OK else PrinterStatus.UNKNOWN
        } catch (_: Exception) {
            PrinterStatus.UNKNOWN
        }
    }

    override fun isConnected(): Boolean {
        return socket?.isConnected == true && socket?.isClosed == false
    }

    override fun close() {
        try {
            outputStream?.close()
            socket?.close()
        } catch (_: Exception) { }
        outputStream = null
        socket = null
    }

    private fun bitmapToBrotherRaster(bitmap: Bitmap): ByteArray {
        val width = bitmap.width
        val height = bitmap.height
        val bytesPerLine = ((width + 7) / 8) + 1
        val pixels = IntArray(width * height)
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

        val out = java.io.ByteArrayOutputStream()

        out.write(byteArrayOf(0x1B, 0x69, 0x61, 0x01))
        out.write(byteArrayOf(0x1B, 0x69, 0x42, 0x00))
        out.write(byteArrayOf(0x1B, 0x69, 0x4D, 0x0A))
        out.write(byteArrayOf(0x1B, 0x69, 0x64, 0x00))
        out.write(
            byteArrayOf(
                0x1B, 0x69, 0x7A,
                0x00, 0x00, 0x01, 0x2C,
            )
        )

        val rasterLine = ByteArray(bytesPerLine)
        rasterLine[0] = 0x47

        for (y in 0 until height) {
            java.util.Arrays.fill(rasterLine, 1, bytesPerLine, 0.toByte())

            for (x in 0 until width) {
                val pixel = pixels[y * width + x]
                val r = (pixel shr 16) and 0xFF
                val g = (pixel shr 8) and 0xFF
                val b = pixel and 0xFF
                val luminance = (0.299 * r + 0.587 * g + 0.114 * b).toInt()
                val black = luminance < 128

                if (black) {
                    val byteIndex = 1 + (x / 8)
                    val bitIndex = 7 - (x % 8)
                    rasterLine[byteIndex] = (rasterLine[byteIndex].toInt() or (1 shl bitIndex)).toByte()
                }
            }

            out.write(rasterLine)
        }

        out.write(byteArrayOf(0x1A))
        out.write(byteArrayOf(0x0C))

        return out.toByteArray()
    }
}
