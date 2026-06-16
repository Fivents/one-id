package com.oneid.totem.data.print

import android.graphics.Bitmap
import android.content.Context
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.domain.model.PrintData
import com.oneid.totem.domain.repository.PrintResult
import com.oneid.totem.domain.repository.PrintRepository
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
    @ApplicationContext private val context: Context,
    private val printRepository: PrintRepository,
    private val badgeRenderer: BadgeRenderer,
    private val prefs: TotemPreferences,
) {

    private var printer: BrotherPrinter? = null

    suspend fun printBadge(
        eventParticipantId: String,
        checkInId: String?,
    ): PrintJobResult = withContext(Dispatchers.Default) {
        val printData = when (val result = printRepository.printBadge(eventParticipantId, checkInId)) {
            is PrintResult.Success -> result.data
            is PrintResult.Error -> return@withContext PrintJobResult.Error(result.message)
        }

        val bitmap = try {
            badgeRenderer.render(
                html = printData.html,
                paperWidthMm = printData.paperWidth,
                paperHeightMm = printData.paperHeight,
                dpi = printData.printerDpi,
            )
        } catch (e: Exception) {
            return@withContext PrintJobResult.Error("Falha ao renderizar badge: ${e.message}")
        }

        connectAndPrint(bitmap, printData)
    }

    suspend fun printWithBitmap(
        bitmap: Bitmap,
        printData: PrintData,
    ): PrintJobResult = withContext(Dispatchers.Default) {
        connectAndPrint(bitmap, printData)
    }

    private suspend fun connectAndPrint(
        bitmap: Bitmap,
        printData: PrintData,
    ): PrintJobResult {
        val printer = getPrinter()
        val printerIp = prefs.printerIp.ifBlank {
            PrinterConfig.printerIp
        }

        if (printerIp.isBlank()) {
            return PrintJobResult.Error("Impressora não configurada. Configure o IP nas configurações")
        }

        when (val connectResult = printer.connect(printerIp)) {
            is PrintJobResult.Error -> return connectResult
            else -> { }
        }

        val printResult = printer.printBitmap(bitmap, printData.copies)

        printer.close()

        return printResult
    }

    fun setPrinter(printer: BrotherPrinter) {
        this.printer?.close()
        this.printer = printer
    }

    private fun getPrinter(): BrotherPrinter {
        return printer ?: BrotherRasterPrinter().also { printer = it }
    }

    fun dispose() {
        printer?.close()
    }
}
