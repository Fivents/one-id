package com.oneid.totem.data.print

import android.graphics.Bitmap
import java.io.Closeable

sealed class PrintJobResult {
    data object Success : PrintJobResult()
    data class Error(val message: String) : PrintJobResult()
}

enum class PrinterStatus {
    OK,
    PAPER_EMPTY,
    BATTERY_LOW,
    COVER_OPEN,
    OVERHEAT,
    PRINTING,
    BUSY,
    NO_MEDIA,
    ERROR,
    UNKNOWN,
}

interface BrotherPrinter : Closeable {
    suspend fun connect(ipAddress: String, port: Int = 9100): PrintJobResult
    suspend fun printBitmap(bitmap: Bitmap, copies: Int = 1): PrintJobResult
    suspend fun getStatus(): PrinterStatus
    suspend fun isConnected(): Boolean
}
