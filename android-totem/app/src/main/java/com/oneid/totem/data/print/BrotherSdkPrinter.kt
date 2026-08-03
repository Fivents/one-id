package com.oneid.totem.data.print

import android.content.Context
import android.graphics.Bitmap
import com.brother.sdk.lmprinter.*
import com.brother.sdk.lmprinter.setting.PrintImageSettings
import com.brother.sdk.lmprinter.setting.QLPrintSettings
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BrotherSdkPrinter @Inject constructor(
    @ApplicationContext private val appContext: Context,
) : BrotherPrinter {

    private var driver: PrinterDriver? = null
    private var connectedLabelSize: QLPrintSettings.LabelSize? = null

    private val workPath: String by lazy {
        File(appContext.cacheDir, "brother_print").also { it.mkdirs() }.absolutePath
    }

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

                connectedLabelSize = queryLabelSize(result.driver)

                PrintJobResult.Success
            } catch (e: Exception) {
                PrintJobResult.Error("Conexão falhou: ${e.message}")
            }
        }
    }

    private fun queryLabelSize(d: PrinterDriver): QLPrintSettings.LabelSize {
        return try {
            val statusResult = d.printerStatus
            if (statusResult.error.code == GetStatusError.ErrorCode.NoError) {
                val ls = statusResult.printerStatus?.mediaInfo?.getQLLabelSize()
                ls ?: QLPrintSettings.LabelSize.RollW62
            } else {
                QLPrintSettings.LabelSize.RollW62
            }
        } catch (e: Exception) {
            QLPrintSettings.LabelSize.RollW62
        }
    }

    override suspend fun printBitmap(bitmap: Bitmap, copies: Int): PrintJobResult {
        return withContext(Dispatchers.IO) {
            try {
                val d = driver ?: return@withContext PrintJobResult.Error("Impressora não conectada")

                val labelSize = connectedLabelSize ?: queryLabelSize(d)

                val settings = QLPrintSettings(PrinterModel.QL_810W).apply {
                    this.labelSize = labelSize
                    numCopies = copies
                    halftone = PrintImageSettings.Halftone.ErrorDiffusion
                    printQuality = PrintImageSettings.PrintQuality.Best
                    isAutoCut = true
                    isCutAtEnd = true
                    isSkipStatusCheck = false
                    hAlignment = PrintImageSettings.HorizontalAlignment.Center
                    vAlignment = PrintImageSettings.VerticalAlignment.Center
                    printOrientation = PrintImageSettings.Orientation.Portrait
                    scaleMode = PrintImageSettings.ScaleMode.FitPageAspect
                    compress = PrintImageSettings.CompressMode.Mode9
                    workPath = this@BrotherSdkPrinter.workPath
                }

                val printError = d.printImage(bitmap, settings)

                if (printError.code != PrintError.ErrorCode.NoError) {
                    val desc = printError.errorDescription
                    val msg = if (!desc.isNullOrBlank()) {
                        "Erro de impressão: ${printError.code} - $desc"
                    } else {
                        "Erro de impressão: ${printError.code}"
                    }
                    PrintJobResult.Error(msg)
                } else {
                    PrintJobResult.Success
                }
            } catch (e: Exception) {
                PrintJobResult.Error("Impressão falhou: ${e.message}")
            }
        }
    }

    override suspend fun getStatus(): PrinterStatus {
        return PrinterStatus.UNKNOWN
    }

    override suspend fun isConnected(): Boolean = withContext(Dispatchers.IO) {
        val d = driver ?: return@withContext false
        try {
            val statusResult = d.printerStatus
            statusResult.error.code == GetStatusError.ErrorCode.NoError
        } catch (e: Exception) {
            false
        }
    }

    override fun close() {
        try {
            driver?.closeChannel()
        } catch (_: Exception) { }
        driver = null
    }
}
