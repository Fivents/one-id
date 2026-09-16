package com.oneid.totem.data.print

import android.content.Context
import android.graphics.Bitmap
import android.hardware.usb.UsbManager
import com.brother.sdk.lmprinter.*
import com.brother.sdk.lmprinter.setting.PrintImageSettings
import com.brother.sdk.lmprinter.setting.QLPrintSettings
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BrotherSdkPrinter @Inject constructor(
    @ApplicationContext private val appContext: Context,
    private val printerConfigRepository: PrinterConfigRepository,
) : BrotherPrinter {

    // O PrinterDriver da Brother não é thread-safe: consultar printerStatus (o polling da
    // tela de configuração roda a cada 5s) enquanto printImage está no ar derrubava o
    // processo inteiro dentro da lib nativa, sem exceção Java pra capturar — era o app
    // "fechando sozinho" ao imprimir. Toda operação que toca o driver passa por este mutex.
    private val driverMutex = Mutex()

    private var driver: PrinterDriver? = null
    private var connectedLabelSize: QLPrintSettings.LabelSize? = null
    private var activeConnectionType: PrinterConnectionType = PrinterConnectionType.WIFI

    private val workPath: String by lazy {
        File(appContext.cacheDir, "brother_print").also { it.mkdirs() }.absolutePath
    }

    override suspend fun connect(ipAddress: String, port: Int): PrintJobResult {
        return withContext(Dispatchers.IO) {
            driverMutex.withLock {
                try {
                    closeDriver()
                    val channel = Channel.newWifiChannel(ipAddress)
                    val result = PrinterDriverGenerator.openChannel(channel)
                    if (result.error.code != OpenChannelError.ErrorCode.NoError) {
                        return@withLock PrintJobResult.Error(
                            "Falha ao conectar via WiFi: ${result.error.code}"
                        )
                    }
                    driver = result.driver
                    activeConnectionType = PrinterConnectionType.WIFI

                    connectedLabelSize = queryLabelSize(result.driver)

                    PrintJobResult.Success
                } catch (e: Throwable) {
                    PrintJobResult.Error("Conexão WiFi falhou: ${e.message}")
                }
            }
        }
    }

    override suspend fun connectUsb(context: Context, usbManager: UsbManager): PrintJobResult {
        return withContext(Dispatchers.IO) {
            // A permissão USB é pedida fora do mutex de propósito: ela abre um diálogo do
            // sistema e pode ficar pendurada esperando o usuário, e segurar o driver travado
            // nesse meio-tempo bloquearia qualquer outra operação (inclusive o polling).
            val device = usbManager.deviceList.values.firstOrNull { it.vendorId == BROTHER_VENDOR_ID }
                ?: return@withContext PrintJobResult.Error(
                    "Nenhuma impressora Brother USB encontrada"
                )

            if (!usbManager.hasPermission(device)) {
                val permissionGranted = try {
                    UsbPermissionReceiver.requestPermission(usbManager, device, context)
                } catch (e: Throwable) {
                    return@withContext PrintJobResult.Error("Falha ao pedir permissão USB: ${e.message}")
                }
                if (!permissionGranted) {
                    return@withContext PrintJobResult.Error("Permissão USB negada pelo usuário")
                }
            }

            driverMutex.withLock {
                try {
                    closeDriver()

                    val channel = Channel.newUsbChannel(usbManager)
                    val result = PrinterDriverGenerator.openChannel(channel)
                    if (result.error.code != OpenChannelError.ErrorCode.NoError) {
                        return@withLock PrintJobResult.Error(
                            "Falha ao conectar via USB: ${result.error.code}"
                        )
                    }
                    driver = result.driver
                    activeConnectionType = PrinterConnectionType.USB

                    connectedLabelSize = queryLabelSize(result.driver)

                    PrintJobResult.Success
                } catch (e: Throwable) {
                    PrintJobResult.Error("Conexão USB falhou: ${e.message}")
                }
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
        } catch (e: Throwable) {
            QLPrintSettings.LabelSize.RollW62
        }
    }

    override suspend fun printBitmap(bitmap: Bitmap, copies: Int): PrintJobResult {
        return withContext(Dispatchers.IO) {
            driverMutex.withLock {
                var rotated: Bitmap? = null
                try {
                    val d = driver ?: return@withLock PrintJobResult.Error("Impressora não conectada")

                    val labelSize = connectedLabelSize ?: queryLabelSize(d)

                    rotated = rotateToLabelOrientation(bitmap, printerConfigRepository.orientationValue)

                    val settings = QLPrintSettings(PrinterModel.QL_810W).apply {
                        this.labelSize = labelSize
                        numCopies = copies
                        halftone = PrintImageSettings.Halftone.ErrorDiffusion
                        printQuality = PrintImageSettings.PrintQuality.Best
                        isAutoCut = true
                        isCutAtEnd = true
                        isSkipStatusCheck = false
                        hAlignment = PrintImageSettings.HorizontalAlignment.Center
                        // Top em vez de Center: numa fita contínua, "vertical" é o eixo do
                        // comprimento (feed) — Center deixava uma folga em branco antes E depois
                        // do conteúdo quando a página calculada pelo driver é maior que o bitmap;
                        // Top empurra essa folga toda pro final, aproveitando o início da etiqueta.
                        vAlignment = PrintImageSettings.VerticalAlignment.Top
                        // Sempre Portrait: a rotação é feita por nós em rotateToLabelOrientation,
                        // então o bitmap já chega aqui na mesma orientação da página. Deixar o
                        // driver rotacionar de novo giraria duas vezes.
                        printOrientation = PrintImageSettings.Orientation.Portrait
                        scaleMode = PrintImageSettings.ScaleMode.FitPageAspect
                        compress = PrintImageSettings.CompressMode.Mode9
                        workPath = this@BrotherSdkPrinter.workPath
                    }

                    val printError = d.printImage(rotated, settings)

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
                } catch (e: Throwable) {
                    // Throwable e não Exception: falhas da lib nativa da Brother chegam como
                    // Error (UnsatisfiedLinkError, OutOfMemoryError...), que passariam direto
                    // por um catch de Exception e matariam o processo.
                    PrintJobResult.Error("Impressão falhou: ${e.message}")
                } finally {
                    // O bitmap girado é uma cópia só nossa (o original continua vivo no preview
                    // da tela), então some com ele assim que o driver termina de usar.
                    if (rotated !== bitmap) rotated?.recycle()
                }
            }
        }
    }

    override suspend fun getStatus(): PrinterStatus {
        return PrinterStatus.UNKNOWN
    }

    override suspend fun isConnected(): Boolean = withContext(Dispatchers.IO) {
        driverMutex.withLock {
            val d = driver ?: return@withLock false
            try {
                val statusResult = d.printerStatus
                statusResult.error.code == GetStatusError.ErrorCode.NoError
            } catch (e: Throwable) {
                false
            }
        }
    }

    fun getConnectionType(): PrinterConnectionType = activeConnectionType

    override fun close() {
        // close() vem do Closeable (não é suspend), então não dá pra pegar o mutex aqui. As
        // chamadas internas usam closeDriver() já dentro da região travada; esta versão
        // pública é usada só pelos caminhos de desconexão explícita da UI.
        closeDriver()
    }

    private fun closeDriver() {
        try {
            driver?.closeChannel()
        } catch (_: Throwable) { }
        driver = null
        connectedLabelSize = null
    }

    private companion object {
        private const val BROTHER_VENDOR_ID = 0x04F9
    }
}
