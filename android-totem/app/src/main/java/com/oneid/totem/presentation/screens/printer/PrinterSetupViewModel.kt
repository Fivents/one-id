package com.oneid.totem.presentation.screens.printer

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.brother.sdk.lmprinter.Channel
import com.brother.sdk.lmprinter.NetworkSearchOption
import com.brother.sdk.lmprinter.PrinterSearcher
import com.oneid.totem.data.print.BadgeRenderer
import com.oneid.totem.data.print.PrintJobResult
import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.data.print.PrinterConnectionManager
import com.oneid.totem.data.print.PrinterStatus
import com.oneid.totem.domain.repository.LabelLayout
import com.oneid.totem.domain.repository.PrintConfig
import com.oneid.totem.domain.repository.PrintRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

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
    val labelLayout: LabelLayout = LabelLayout.STANDARD,
)

@HiltViewModel
class PrinterSetupViewModel @Inject constructor(
    @ApplicationContext private val appContext: Context,
    private val printerConfigRepository: PrinterConfigRepository,
    private val printerConnectionManager: PrinterConnectionManager,
    private val badgeRenderer: BadgeRenderer,
    private val printRepository: PrintRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(PrinterSetupUiState())
    val uiState = _uiState.asStateFlow()

    init {
        printerConfigRepository.load()
        val ip = printerConfigRepository.printerIpValue
        val savedOrientation = printerConfigRepository.orientationValue
        val savedLabelLayout = printerConfigRepository.labelLayoutValue
        _uiState.update {
            it.copy(
                savedIp = ip,
                manualIp = ip,
                orientation = savedOrientation,
                labelLayout = savedLabelLayout,
            )
        }
        checkCurrentConnection(ip)
        fetchPrintConfig()
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
            } catch (_: Exception) {
                // Silently use defaults if API fetch fails
            }
        }
    }

    private fun checkCurrentConnection(ip: String) {
        if (ip.isBlank()) return
        viewModelScope.launch {
            _uiState.update { it.copy(isConnecting = true) }
            val result = printerConnectionManager.ensureConnected(ip)
            if (result is PrintJobResult.Success) {
                _uiState.update {
                    it.copy(
                        isConnecting = false,
                        connectedIp = ip,
                        connectionStatus = printerConnectionManager.getStatus(),
                    )
                }
            } else {
                _uiState.update { it.copy(isConnecting = false) }
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
                _uiState.update {
                    it.copy(
                        isConnecting = false,
                        connectedIp = ip,
                        connectionStatus = status,
                    )
                }
            } else {
                _uiState.update {
                    it.copy(
                        isConnecting = false,
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
    }

    fun testPrint() {
        viewModelScope.launch {
            _uiState.update { it.copy(isTesting = true, testResult = null) }
            val ip = _uiState.value.connectedIp ?: _uiState.value.savedIp
            if (ip.isBlank()) {
                _uiState.update {
                    it.copy(isTesting = false, testResult = "Nenhuma impressora configurada")
                }
                return@launch
            }
            try {
                val labelLayout = _uiState.value.labelLayout
                val bitmap = badgeRenderer.renderFromData(
                    name = "TESTE DE IMPRESSÃO",
                    company = "ONE-ID",
                    jobTitle = "Impressora: $ip",
                    qrCodeValue = null,
                    accessCode = null,
                    paperWidthMm = 62.0,
                    paperHeightMm = 100.0,
                    dpi = 300,
                    labelLayout = labelLayout,
                )
                val result = printerConnectionManager.printWithReconnect(bitmap, ip, 1)
                _uiState.update {
                    it.copy(
                        isTesting = false,
                        testResult = when (result) {
                            is PrintJobResult.Success -> "Impressão de teste bem-sucedida!"
                            is PrintJobResult.Error -> "Erro: ${result.message}"
                        },
                    )
                }
            } catch (e: Exception) {
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
