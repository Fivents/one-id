package com.oneid.totem.data.print

import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PrinterConnectionManager @Inject constructor(
    private val printer: BrotherPrinter,
) {
    private var currentIp: String = ""
    private var retryCount = 0
    private val mutex = Mutex()

    private companion object {
        private const val MAX_RETRIES = 5
        private const val BASE_DELAY_MS = 1_000L
        private const val MAX_DELAY_MS = 30_000L
    }

    suspend fun ensureConnected(ip: String): PrintJobResult = mutex.withLock {
        if (printer.isConnected() && ip == currentIp) {
            return PrintJobResult.Success
        }

        printer.close()
        currentIp = ip
        retryCount = 0

        while (retryCount < MAX_RETRIES) {
            val result = printer.connect(ip)
            if (result is PrintJobResult.Success) {
                retryCount = 0
                return PrintJobResult.Success
            }
            retryCount++
            val delayMs = (BASE_DELAY_MS shl (retryCount - 1)).coerceAtMost(MAX_DELAY_MS)
            delay(delayMs)
        }

        PrintJobResult.Error("Falha ao conectar após $MAX_RETRIES tentativas")
    }

    suspend fun printWithReconnect(
        bitmap: android.graphics.Bitmap,
        ip: String,
        copies: Int = 1,
    ): PrintJobResult {
        val connectResult = ensureConnected(ip)
        if (connectResult is PrintJobResult.Error) return connectResult

        val result = printer.printBitmap(bitmap, copies)
        if (result is PrintJobResult.Error) {
            printer.close()
            currentIp = ""
            retryCount = 0
        }
        return result
    }

    suspend fun getStatus(): PrinterStatus {
        return printer.getStatus()
    }

    fun disconnect() {
        printer.close()
        currentIp = ""
        retryCount = 0
    }
}
