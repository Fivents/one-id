package com.oneid.totem.data.print

import android.content.Context
import android.graphics.Bitmap
import android.hardware.usb.UsbManager
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
    private var currentConnectionType: PrinterConnectionType = PrinterConnectionType.WIFI
    private var retryCount = 0
    private val mutex = Mutex()

    private companion object {
        private const val MAX_RETRIES = 5
        private const val BASE_DELAY_MS = 1_000L
        private const val MAX_DELAY_MS = 30_000L
    }

    suspend fun ensureConnected(ip: String): PrintJobResult = mutex.withLock {
        if (ip == currentIp && currentConnectionType == PrinterConnectionType.WIFI && printer.isConnected()) {
            return PrintJobResult.Success
        }

        printer.close()
        currentIp = ip
        currentConnectionType = PrinterConnectionType.WIFI
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

    suspend fun ensureConnectedUsb(context: Context, usbManager: UsbManager): PrintJobResult = mutex.withLock {
        if (currentConnectionType == PrinterConnectionType.USB && printer.isConnected()) {
            return PrintJobResult.Success
        }

        printer.close()
        currentConnectionType = PrinterConnectionType.USB
        currentIp = ""
        retryCount = 0

        while (retryCount < MAX_RETRIES) {
            val result = printer.connectUsb(context, usbManager)
            if (result is PrintJobResult.Success) {
                retryCount = 0
                return PrintJobResult.Success
            }
            retryCount++
            val delayMs = (BASE_DELAY_MS shl (retryCount - 1)).coerceAtMost(MAX_DELAY_MS)
            delay(delayMs)
        }

        PrintJobResult.Error("Falha ao conectar via USB após $MAX_RETRIES tentativas")
    }

    suspend fun printWithReconnect(
        bitmap: Bitmap,
        ip: String,
        copies: Int = 1,
    ): PrintJobResult {
        val connectResult = ensureConnected(ip)
        if (connectResult is PrintJobResult.Error) return connectResult

        val result = printer.printBitmap(bitmap, copies)
        if (result is PrintJobResult.Error) {
            printer.close()
            currentIp = ""
            currentConnectionType = PrinterConnectionType.WIFI
            retryCount = 0
        }
        return result
    }

    suspend fun printWithReconnectUsb(
        bitmap: Bitmap,
        context: Context,
        usbManager: UsbManager,
        copies: Int = 1,
    ): PrintJobResult {
        val connectResult = ensureConnectedUsb(context, usbManager)
        if (connectResult is PrintJobResult.Error) return connectResult

        val result = printer.printBitmap(bitmap, copies)
        if (result is PrintJobResult.Error) {
            printer.close()
            currentConnectionType = PrinterConnectionType.WIFI
            retryCount = 0
        }
        return result
    }

    suspend fun autoDetectAndConnect(context: Context): Pair<PrintJobResult, PrinterConnectionType> {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as? UsbManager
        if (usbManager != null) {
            val hasUsb = usbManager.deviceList.values.any { device ->
                device.vendorId == 0x04F9
            }
            if (hasUsb) {
                val result = ensureConnectedUsb(context, usbManager)
                return result to PrinterConnectionType.USB
            }
        }

        return PrintJobResult.Error("Nenhuma impressora encontrada") to PrinterConnectionType.WIFI
    }

    suspend fun getStatus(): PrinterStatus {
        return printer.getStatus()
    }

    /**
     * Checagem leve e ao vivo (sem retry, sem fechar/reabrir canal) de se a impressora
     * ainda responde. Usada pela UI pra manter o status "conectado" fiel à realidade
     * em vez de confiar só no que foi salvo na última conexão bem-sucedida.
     */
    suspend fun isConnectedNow(type: PrinterConnectionType): Boolean {
        if (currentConnectionType != type) return false
        return printer.isConnected()
    }

    fun getCurrentConnectionType(): PrinterConnectionType = currentConnectionType

    fun disconnect() {
        printer.close()
        currentIp = ""
        currentConnectionType = PrinterConnectionType.WIFI
        retryCount = 0
    }
}
