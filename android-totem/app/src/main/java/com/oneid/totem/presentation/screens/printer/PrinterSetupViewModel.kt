package com.oneid.totem.presentation.screens.printer

import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.brother.sdk.lmprinter.Channel
import com.brother.sdk.lmprinter.NetworkSearchOption
import com.brother.sdk.lmprinter.PrinterSearcher
import com.oneid.totem.data.print.BadgeRenderer
import com.oneid.totem.data.print.PrintJobResult
import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.data.print.PrinterConnectionManager
import com.oneid.totem.data.print.PrinterConnectionType
import com.oneid.totem.data.print.PrinterStatus
import com.oneid.totem.data.print.UsbPrinterDiscovery
import com.oneid.totem.domain.repository.AccessCodeKeyboard
import com.oneid.totem.domain.repository.LabelLayout
import com.oneid.totem.domain.repository.PrintConfig
import com.oneid.totem.domain.repository.PrintRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

private const val CONNECTION_POLL_INTERVAL_MS = 5_000L

// Dados de exemplo usados tanto no preview quanto na impressão de teste — o mesmo
// bitmap gerado aqui é reaproveitado nos dois lugares, então o que aparece na tela
// é garantidamente o mesmo que sai impresso.
private const val PREVIEW_NAME = "MARIA EDUARDA SILVA SANTOS DE OLIVEIRA"
private const val PREVIEW_COMPANY = "EMPRESA EXEMPLO DE TECNOLOGIA E SERVIÇOS LTDA"
private const val PREVIEW_JOB_TITLE = "DIRETORA DE MARKETING E VENDAS"
private const val PREVIEW_QR_CODE_VALUE = "teste-print-001"
private const val PREVIEW_EVENT_NAME = "EVENTO"
private const val PREVIEW_DPI = 300

data class DiscoveredPrinter(
    val modelName: String,
    val ipAddress: String,
    val macAddress: String? = null,
    val nodeName: String? = null,
)

data class PrinterSetupUiState(
    val savedIp: String = "",
    val discoveredPrinters: List<DiscoveredPrinter> = emptyList(),
    val isSearching: Boolean = false,
    val searchError: String? = null,
    val isConnecting: Boolean = false,
    val connectedIp: String? = null,
    val connectionStatus: PrinterStatus? = null,
    val manualIp: String = "",
    val isTesting: Boolean = false,
    val testResult: String? = null,
    val printConfig: PrintConfig? = null,
    val orientation: String = "PORTRAIT",
    val labelLayout: LabelLayout = LabelLayout.COMPACT,
    val accessCodeKeyboard: AccessCodeKeyboard = AccessCodeKeyboard.ALPHANUMERIC,
    val connectionType: PrinterConnectionType = PrinterConnectionType.WIFI,
    val usbAvailable: Boolean = false,
    val usbDeviceName: String? = null,
    val isUsbConnecting: Boolean = false,
    val isUsbSearching: Boolean = false,
    val isConnected: Boolean = false,
    val previewBitmap: Bitmap? = null,
    val settingsSecurityCodeEnabled: Boolean = false,
)

@HiltViewModel
class PrinterSetupViewModel @Inject constructor(
    @ApplicationContext private val appContext: Context,
    private val printerConfigRepository: PrinterConfigRepository,
    private val printerConnectionManager: PrinterConnectionManager,
    private val usbPrinterDiscovery: UsbPrinterDiscovery,
    val badgeRenderer: BadgeRenderer,
    private val printRepository: PrintRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(PrinterSetupUiState())
    val uiState = _uiState.asStateFlow()

    init {
        printerConfigRepository.load()
        val ip = printerConfigRepository.printerIpValue
        val savedOrientation = printerConfigRepository.orientationValue
        val savedLabelLayout = printerConfigRepository.labelLayoutValue
        val savedAccessCodeKeyboard = printerConfigRepository.accessCodeKeyboardValue
        val savedConnectionType = printerConfigRepository.connectionTypeValue
        val savedSettingsSecurityCodeEnabled = printerConfigRepository.settingsSecurityCodeEnabledValue
        _uiState.update {
            it.copy(
                savedIp = ip,
                manualIp = ip,
                orientation = savedOrientation,
                labelLayout = savedLabelLayout,
                accessCodeKeyboard = savedAccessCodeKeyboard,
                connectionType = savedConnectionType,
                settingsSecurityCodeEnabled = savedSettingsSecurityCodeEnabled,
            )
        }
        checkCurrentConnection()
        fetchPrintConfig()
        checkUsbDevices()
        startConnectionPolling()
        regeneratePreview()
    }

    /**
     * Gera o bitmap do preview com dados de exemplo — o mesmo bitmap é reaproveitado
     * pelo teste de impressão, então preview e impressão de teste nunca divergem.
     */
    private fun regeneratePreview() {
        viewModelScope.launch {
            val config = _uiState.value.printConfig
            val bitmap = try {
                badgeRenderer.renderFromData(
                    name = PREVIEW_NAME,
                    company = PREVIEW_COMPANY,
                    jobTitle = PREVIEW_JOB_TITLE,
                    qrCodeValue = PREVIEW_QR_CODE_VALUE,
                    accessCode = null,
                    showQrCode = config?.showQrCode ?: true,
                    showAccessCode = config?.showAccessCode ?: false,
                    eventName = PREVIEW_EVENT_NAME,
                    paperWidthMm = config?.paperWidth ?: 62.0,
                    paperHeightMm = config?.paperHeight ?: 100.0,
                    dpi = PREVIEW_DPI,
                    labelLayout = _uiState.value.labelLayout,
                )
            } catch (e: Throwable) {
                // Sem catch aqui, uma falha ao montar o bitmap escapava da coroutine e
                // matava o app — o preview simplesmente não aparecer é bem melhor.
                _uiState.update { it.copy(testResult = "Falha ao gerar o preview: ${e.message}") }
                return@launch
            }
            _uiState.update { it.copy(previewBitmap = bitmap) }
        }
    }

    /**
     * Verifica periodicamente, ao vivo, se a impressora ainda responde — evita que a tela
     * continue mostrando "conectada" depois que a impressora física é desligada/desconectada
     * enquanto a tela está aberta.
     */
    private fun startConnectionPolling() {
        viewModelScope.launch {
            while (true) {
                delay(CONNECTION_POLL_INTERVAL_MS)
                // isTesting entra na lista: o polling consulta o status da impressora, e
                // fazer isso no meio de um job de impressão disputa o driver da Brother com o
                // printImage — além de deixar o status piscando "desconectado" durante o job.
                val state = _uiState.value
                if (state.isConnecting || state.isUsbConnecting || state.isTesting) continue
                val connected = printerConnectionManager.isConnectedNow(_uiState.value.connectionType)
                _uiState.update { it.copy(isConnected = connected) }
            }
        }
    }

    fun disconnect() {
        printerConnectionManager.disconnect()
        _uiState.update {
            it.copy(isConnected = false, connectionStatus = null)
        }
    }

    private fun fetchPrintConfig() {
        viewModelScope.launch {
            try {
                val config = withContext(Dispatchers.IO) {
                    printRepository.getPrintConfig()
                }
                _uiState.update {
                    it.copy(
                        printConfig = config,
                        orientation = config.orientation,
                    )
                }
                printerConfigRepository.setOrientation(config.orientation)
                regeneratePreview()
            } catch (_: Exception) {
                // Silently use defaults if API fetch fails
            }
        }
    }

    private fun checkCurrentConnection() {
        val connectionType = _uiState.value.connectionType
        if (connectionType == PrinterConnectionType.USB) {
            if (!usbPrinterDiscovery.hasUsbPrinter()) return
            viewModelScope.launch {
                _uiState.update { it.copy(isConnecting = true) }
                val usbManager = usbPrinterDiscovery.resolveUsbManager()
                val result = printerConnectionManager.ensureConnectedUsb(appContext, usbManager)
                if (result is PrintJobResult.Success) {
                    _uiState.update {
                        it.copy(
                            isConnecting = false,
                            isConnected = true,
                            connectionStatus = printerConnectionManager.getStatus(),
                        )
                    }
                } else {
                    _uiState.update { it.copy(isConnecting = false, isConnected = false) }
                }
            }
        } else {
            val ip = _uiState.value.savedIp
            if (ip.isBlank()) return
            viewModelScope.launch {
                _uiState.update { it.copy(isConnecting = true) }
                val result = printerConnectionManager.ensureConnected(ip)
                if (result is PrintJobResult.Success) {
                    _uiState.update {
                        it.copy(
                            isConnecting = false,
                            isConnected = true,
                            connectedIp = ip,
                            connectionStatus = printerConnectionManager.getStatus(),
                        )
                    }
                } else {
                    _uiState.update { it.copy(isConnecting = false, isConnected = false) }
                }
            }
        }
    }

    private fun checkUsbDevices() {
        val printers = usbPrinterDiscovery.findAllConnectedPrinters()
        _uiState.update {
            it.copy(
                usbAvailable = printers.isNotEmpty(),
                usbDeviceName = printers.firstOrNull()?.deviceName,
            )
        }
    }

    fun searchUsb() {
        viewModelScope.launch {
            _uiState.update { it.copy(isUsbSearching = true) }
            checkUsbDevices()
            _uiState.update { it.copy(isUsbSearching = false) }
        }
    }

    fun connectUsb() {
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isUsbConnecting = true,
                    searchError = null,
                )
            }
            val usbManager = usbPrinterDiscovery.resolveUsbManager()
            val result = printerConnectionManager.ensureConnectedUsb(appContext, usbManager)
            if (result is PrintJobResult.Success) {
                printerConfigRepository.setConnectionType(PrinterConnectionType.USB)
                _uiState.update {
                    it.copy(
                        isUsbConnecting = false,
                        isConnected = true,
                        connectionType = PrinterConnectionType.USB,
                        connectionStatus = printerConnectionManager.getStatus(),
                    )
                }
            } else {
                _uiState.update {
                    it.copy(
                        isUsbConnecting = false,
                        isConnected = false,
                        searchError = "Falha ao conectar via USB: ${(result as PrintJobResult.Error).message}",
                    )
                }
            }
        }
    }

    fun switchToWifi() {
        printerConfigRepository.setConnectionType(PrinterConnectionType.WIFI)
        _uiState.update { it.copy(connectionType = PrinterConnectionType.WIFI, isConnected = false) }
        refreshConnectionStatus(PrinterConnectionType.WIFI)
    }

    fun switchToUsb() {
        printerConfigRepository.setConnectionType(PrinterConnectionType.USB)
        _uiState.update { it.copy(connectionType = PrinterConnectionType.USB, isConnected = false) }
        checkUsbDevices()
        refreshConnectionStatus(PrinterConnectionType.USB)
    }

    /** Checagem ao vivo e leve (sem retry) usada ao trocar de aba, pra já refletir se
     * aquele tipo de conexão está ativo sem precisar esperar o próximo ciclo do polling. */
    private fun refreshConnectionStatus(type: PrinterConnectionType) {
        viewModelScope.launch {
            val connected = printerConnectionManager.isConnectedNow(type)
            if (_uiState.value.connectionType == type) {
                _uiState.update { it.copy(isConnected = connected) }
            }
        }
    }

    fun startSearch() {
        PrinterSearcher.cancelNetworkSearch()
        viewModelScope.launch {
            _uiState.update {
                it.copy(isSearching = true, searchError = null, discoveredPrinters = emptyList())
            }
            val printers = mutableListOf<DiscoveredPrinter>()
            withContext(Dispatchers.IO) {
                try {
                    val option = NetworkSearchOption(5.0, false)
                    PrinterSearcher.startNetworkSearch(appContext, option) { channel ->
                        if (channel.channelType == Channel.ChannelType.Wifi) {
                            val extra = channel.extraInfo
                            printers.add(
                                DiscoveredPrinter(
                                    modelName = extra[Channel.ExtraInfoKey.ModelName] ?: "Impressora",
                                    ipAddress = channel.channelInfo,
                                    macAddress = extra[Channel.ExtraInfoKey.MACAddress],
                                    nodeName = extra[Channel.ExtraInfoKey.NodeName],
                                ),
                            )
                        }
                    }
                } catch (e: Exception) {
                    _uiState.update {
                        it.copy(isSearching = false, searchError = "Erro na busca: ${e.message}")
                    }
                    return@withContext
                }
            }
            _uiState.update {
                it.copy(
                    isSearching = false,
                    discoveredPrinters = printers.toList(),
                    searchError = when {
                        it.searchError != null -> it.searchError
                        printers.isEmpty() -> "Nenhuma impressora encontrada na rede"
                        else -> null
                    },
                )
            }
        }
    }

    fun cancelSearch() {
        PrinterSearcher.cancelNetworkSearch()
        _uiState.update { it.copy(isSearching = false) }
    }

    fun selectPrinter(ip: String) {
        connectToPrinter(ip)
    }

    fun onManualIpChanged(ip: String) {
        _uiState.update { it.copy(manualIp = ip) }
    }

    fun connectManual() {
        val ip = _uiState.value.manualIp.trim()
        if (ip.isBlank()) return
        connectToPrinter(ip)
    }

    private fun connectToPrinter(ip: String) {
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isConnecting = true,
                    connectedIp = null,
                    connectionStatus = null,
                    searchError = null,
                )
            }
            val result = printerConnectionManager.ensureConnected(ip)
            if (result is PrintJobResult.Success) {
                val status = printerConnectionManager.getStatus()
                printerConfigRepository.setIp(ip)
                printerConfigRepository.setConnectionType(PrinterConnectionType.WIFI)
                _uiState.update {
                    it.copy(
                        isConnecting = false,
                        isConnected = true,
                        connectedIp = ip,
                        connectionType = PrinterConnectionType.WIFI,
                        connectionStatus = status,
                    )
                }
            } else {
                _uiState.update {
                    it.copy(
                        isConnecting = false,
                        isConnected = false,
                        searchError = "Falha ao conectar: ${(result as PrintJobResult.Error).message}",
                    )
                }
            }
        }
    }

    fun setOrientation(orientation: String) {
        val normalized = if (orientation == "LANDSCAPE") "LANDSCAPE" else "PORTRAIT"
        _uiState.update { it.copy(orientation = normalized) }
        printerConfigRepository.setOrientation(normalized)
    }

    fun setLabelLayout(layout: LabelLayout) {
        _uiState.update { it.copy(labelLayout = layout) }
        printerConfigRepository.setLabelLayout(layout)
        regeneratePreview()
    }

    fun setAccessCodeKeyboard(mode: AccessCodeKeyboard) {
        _uiState.update { it.copy(accessCodeKeyboard = mode) }
        printerConfigRepository.setAccessCodeKeyboard(mode)
    }

    fun setSettingsSecurityCodeEnabled(enabled: Boolean) {
        _uiState.update { it.copy(settingsSecurityCodeEnabled = enabled) }
        printerConfigRepository.setSettingsSecurityCodeEnabled(enabled)
    }

    fun testPrint() {
        viewModelScope.launch {
            _uiState.update { it.copy(isTesting = true, testResult = null) }
            try {
                // Reaproveita o mesmo bitmap mostrado no preview — garante que o que sai
                // impresso é exatamente o que a pessoa viu na tela antes de clicar.
                val bitmap = _uiState.value.previewBitmap
                if (bitmap == null) {
                    _uiState.update {
                        it.copy(isTesting = false, testResult = "Preview ainda não está pronto, aguarde um instante")
                    }
                    return@launch
                }
                val connectionType = _uiState.value.connectionType
                val result = when (connectionType) {
                    PrinterConnectionType.USB -> {
                        val usbManager = usbPrinterDiscovery.resolveUsbManager()
                        printerConnectionManager.printWithReconnectUsb(bitmap, appContext, usbManager, 1)
                    }
                    PrinterConnectionType.WIFI -> {
                        val ip = _uiState.value.connectedIp ?: _uiState.value.savedIp
                        if (ip.isBlank()) {
                            _uiState.update {
                                it.copy(isTesting = false, testResult = "Nenhuma impressora configurada")
                            }
                            return@launch
                        }
                        printerConnectionManager.printWithReconnect(bitmap, ip, 1)
                    }
                }
                _uiState.update {
                    it.copy(
                        isTesting = false,
                        testResult = when (result) {
                            is PrintJobResult.Success -> "Impressão de teste bem-sucedida!"
                            is PrintJobResult.Error -> "Erro: ${result.message}"
                        },
                    )
                }
            } catch (e: Throwable) {
                // Throwable e não Exception: a lib nativa da Brother pode estourar Error
                // (UnsatisfiedLinkError, OutOfMemoryError...), que escaparia de um catch de
                // Exception e derrubaria o app inteiro em vez de virar mensagem na tela.
                _uiState.update {
                    it.copy(isTesting = false, testResult = "Erro inesperado: ${e.message}")
                }
            }
        }
    }

    override fun onCleared() {
        PrinterSearcher.cancelNetworkSearch()
        super.onCleared()
    }
}
