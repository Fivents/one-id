package com.oneid.totem.data.print

import android.graphics.Bitmap
import java.io.Closeable

sealed class PrintJobResult {
    data object Success : PrintJobResult()
    data class Error(val message: String) : PrintJobResult()
}

interface BrotherPrinter : Closeable {
    suspend fun connect(ipAddress: String, port: Int = 9100): PrintJobResult
    suspend fun printBitmap(bitmap: Bitmap, copies: Int = 1): PrintJobResult
    fun isConnected(): Boolean
}
