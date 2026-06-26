package com.oneid.totem.data.print

import android.graphics.Bitmap
import com.brother.sdk.lmprinter.*
import com.brother.sdk.lmprinter.setting.PrintImageSettings
import com.brother.sdk.lmprinter.setting.QLPrintSettings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BrotherSdkPrinter @Inject constructor() : BrotherPrinter {

    private var driver: PrinterDriver? = null

    override suspend fun connect(ipAddress: String, port: Int): PrintJobResult {
        return withContext(Dispatchers.IO) {
            try {
                close()
                val channel = Channel.newWifiChannel(ipAddress)
                val result = withTimeout(10_000) {
                    PrinterDriverGenerator.openChannel(channel)
                }
                if (result.error.code != OpenChannelError.ErrorCode.NoError) {
                    return@withContext PrintJobResult.Error(
                        "Falha ao conectar: ${result.error.code}"
                    )
                }
                driver = result.driver
                PrintJobResult.Success
            } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
                PrintJobResult.Error("Timeout de conexão — verifique se a impressora está ligada e no IP correto")
            } catch (e: Exception) {
                PrintJobResult.Error("Conexão falhou: ${e.message}")
            }
        }
    }

    override suspend fun printBitmap(bitmap: Bitmap, copies: Int): PrintJobResult {
        return withContext(Dispatchers.IO) {
            try {
                val d = driver ?: return@withContext PrintJobResult.Error("Impressora não conectada")

                val settings = QLPrintSettings(PrinterModel.QL_810W).apply {
                    labelSize = QLPrintSettings.LabelSize.RollW62
                    numCopies = copies
                    halftone = PrintImageSettings.Halftone.ErrorDiffusion
                    printQuality = PrintImageSettings.PrintQuality.Best
                    isAutoCut = true
                    isCutAtEnd = true
                    isSkipStatusCheck = true
                    hAlignment = PrintImageSettings.HorizontalAlignment.Center
                    vAlignment = PrintImageSettings.VerticalAlignment.Center
                    printOrientation = PrintImageSettings.Orientation.Landscape
                    scaleMode = PrintImageSettings.ScaleMode.FitPageAspect
                    compress = PrintImageSettings.CompressMode.Mode9
                }

                val printError = d.printImage(bitmap, settings)

                if (printError.code != PrintError.ErrorCode.NoError) {
                    val message = when (printError.code) {
                        PrintError.ErrorCode.PrinterStatusErrorPaperEmpty -> "Papel acabando ou acabou"
                        PrintError.ErrorCode.PrinterStatusErrorBatteryWeak -> "Bateria da impressora fraca"
                        PrintError.ErrorCode.PrinterStatusErrorCoverOpen -> "Tampa da impressora aberta"
                        PrintError.ErrorCode.PrinterStatusErrorOverHeat -> "Impressora superaquecida — aguarde"
                        PrintError.ErrorCode.PrinterStatusErrorBusy -> "Impressora ocupada"
                        PrintError.ErrorCode.PrinterStatusErrorMediaCannotBeFed -> "Sem mídia na impressora"
                        else -> "Erro de impressão: ${printError.code}"
                    }
                    PrintJobResult.Error(message)
                } else {
                    PrintJobResult.Success
                }
            } catch (e: Exception) {
                PrintJobResult.Error("Impressão falhou: ${e.message}")
            }
        }
    }

    override suspend fun getStatus(): PrinterStatus {
        return try {
            val d = driver ?: return PrinterStatus.UNKNOWN
            val statusResult = d.printerStatus
            val statusError = statusResult.error
            if (statusError.code != com.brother.sdk.lmprinter.GetStatusError.ErrorCode.NoError) {
                return PrinterStatus.UNKNOWN
            }
            val printerStatus = statusResult.printerStatus
            when (printerStatus.errorCode) {
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.NoError -> PrinterStatus.OK
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.NoPaper,
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.PaperJam -> PrinterStatus.PAPER_EMPTY
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.CoverOpen -> PrinterStatus.COVER_OPEN
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.Busy -> PrinterStatus.BUSY
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.BatteryEmpty,
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.BatteryTrouble -> PrinterStatus.BATTERY_LOW
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.MotorSlow,
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.HighVoltageAdapter,
                com.brother.sdk.lmprinter.PrinterStatus.ErrorCode.SystemError -> PrinterStatus.OVERHEAT
                else -> PrinterStatus.ERROR
            }
        } catch (_: Exception) {
            PrinterStatus.UNKNOWN
        }
    }

    override fun isConnected(): Boolean = driver != null

    override fun close() {
        try {
            driver?.closeChannel()
        } catch (_: Exception) { }
        driver = null
    }
}
