package com.oneid.totem.data.print

import android.content.Context
import android.graphics.Bitmap
import com.oneid.totem.domain.model.PrintData
import com.oneid.totem.domain.repository.PrintRepository
import com.oneid.totem.domain.repository.PrintResult
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

data class PrintJob(
    val jobId: String,
    val bitmap: Bitmap,
    val copies: Int,
    val paperHeightMm: Double,
)

@Singleton
class PrintCoordinator @Inject constructor(
    @ApplicationContext private val appContext: Context,
    private val printRepository: PrintRepository,
    private val badgeRenderer: BadgeRenderer,
    private val printerConfigRepository: PrinterConfigRepository,
    private val connectionManager: PrinterConnectionManager,
    private val usbPrinterDiscovery: UsbPrinterDiscovery,
) {

    suspend fun printBadge(
        eventParticipantId: String,
        checkInId: String?,
    ): PrintJobResult = withContext(Dispatchers.Default) {
        val printData = when (val result = printRepository.printBadge(eventParticipantId, checkInId)) {
            is PrintResult.Success -> result.data
            is PrintResult.Error -> return@withContext PrintJobResult.Error(result.message)
        }

        val bitmap = try {
            badgeRenderer.renderFromData(
                name = printData.participantName,
                company = printData.company,
                jobTitle = printData.jobTitle,
                qrCodeValue = printData.qrCodeValue,
                accessCode = printData.accessCode,
                showQrCode = printData.showQrCode,
                showAccessCode = printData.showAccessCode,
                eventName = printData.eventName,
                paperWidthMm = printData.paperWidth,
                paperHeightMm = printData.paperHeight,
                dpi = printData.printerDpi,
                labelLayout = printerConfigRepository.labelLayoutValue,
            )
        } catch (e: Throwable) {
            return@withContext PrintJobResult.Error("Falha ao renderizar badge: ${e.message}")
        }

        printWithConnection(bitmap, printData)
    }

    suspend fun printWithBitmap(
        bitmap: Bitmap,
        printData: PrintData,
    ): PrintJobResult = withContext(Dispatchers.Default) {
        printWithConnection(bitmap, printData)
    }

    private suspend fun printWithConnection(
        bitmap: Bitmap,
        printData: PrintData,
    ): PrintJobResult {
        val connectionType = printerConfigRepository.connectionTypeValue

        return when (connectionType) {
            PrinterConnectionType.USB -> {
                val usbManager = usbPrinterDiscovery.resolveUsbManager()
                connectionManager.printWithReconnectUsb(bitmap, appContext, usbManager, printData.copies)
            }
            PrinterConnectionType.WIFI -> {
                val printerIp = printerConfigRepository.printerIpValue
                if (printerIp.isBlank()) {
                    return PrintJobResult.Error("Impressora não configurada. Configure o IP nas configurações")
                }
                connectionManager.printWithReconnect(bitmap, printerIp, printData.copies)
            }
        }
    }

    fun dispose() {
        connectionManager.disconnect()
    }
}
