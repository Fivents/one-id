package com.oneid.totem.data.print

import android.graphics.Bitmap
import com.brother.sdk.lmprinter.*
import com.brother.sdk.lmprinter.setting.PrintImageSettings
import com.brother.sdk.lmprinter.setting.QLPrintSettings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
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
                val result = PrinterDriverGenerator.openChannel(channel)
                if (result.error.code != OpenChannelError.ErrorCode.NoError) {
                    return@withContext PrintJobResult.Error(
                        "Falha ao conectar: ${result.error.code}"
                    )
                }
                driver = result.driver
                PrintJobResult.Success
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
                    isSkipStatusCheck = false
                    hAlignment = PrintImageSettings.HorizontalAlignment.Center
                    vAlignment = PrintImageSettings.VerticalAlignment.Center
                    printOrientation = PrintImageSettings.Orientation.Landscape
                    scaleMode = PrintImageSettings.ScaleMode.FitPageAspect
                    compress = PrintImageSettings.CompressMode.Mode9
                }

                val printError = d.printImage(bitmap, settings)

                if (printError.code != PrintError.ErrorCode.NoError) {
                    PrintJobResult.Error("Erro de impressão: ${printError.code}")
                } else {
                    PrintJobResult.Success
                }
            } catch (e: Exception) {
                PrintJobResult.Error("Impressão falhou: ${e.message}")
            }
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
