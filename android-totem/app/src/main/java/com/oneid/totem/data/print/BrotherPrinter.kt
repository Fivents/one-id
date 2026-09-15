package com.oneid.totem.data.print

import android.content.Context
import android.graphics.Bitmap
import android.hardware.usb.UsbManager
import java.io.Closeable

enum class PrinterConnectionType {
    WIFI,
    USB,
}

data class UsbPrinterInfo(
    val deviceName: String,
    val vendorId: Int,
    val productId: Int,
)

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
    suspend fun connectUsb(context: Context, usbManager: UsbManager): PrintJobResult
    suspend fun printBitmap(bitmap: Bitmap, copies: Int = 1): PrintJobResult
    suspend fun getStatus(): PrinterStatus
    suspend fun isConnected(): Boolean
}
