package com.oneid.totem.presentation.screens.method

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.data.print.PrinterConnectionManager
import com.oneid.totem.data.print.PrinterConnectionType
import com.oneid.totem.data.print.UsbPrinterDiscovery
import com.oneid.totem.data.service.ModelDownloadState
import com.oneid.totem.data.service.ModelDownloader
import com.oneid.totem.domain.model.TotemSession
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MethodUiState(
    val session: TotemSession? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
    val hasLoggedOut: Boolean = false,
    val printerIp: String = "",
    val connectionType: PrinterConnectionType = PrinterConnectionType.WIFI,
    val usbAvailable: Boolean = false,
    val settingsSecurityCodeEnabled: Boolean = false,
)

@HiltViewModel
class MethodViewModel @Inject constructor(
    @ApplicationContext private val appContext: Context,
    private val authRepository: AuthRepository,
    private val printerConfigRepository: PrinterConfigRepository,
    private val printerConnectionManager: PrinterConnectionManager,
    private val usbPrinterDiscovery: UsbPrinterDiscovery,
    private val modelDownloader: ModelDownloader,
    private val totemPreferences: TotemPreferences,
) : ViewModel() {

    private val _uiState = MutableStateFlow(MethodUiState())
    val uiState = _uiState.asStateFlow()

    val modelDownloadState: StateFlow<ModelDownloadState> = modelDownloader.downloadState

    init {
        printerConfigRepository.load()
        viewModelScope.launch {
            printerConfigRepository.printerIp.collect { ip ->
                _uiState.value = _uiState.value.copy(printerIp = ip)
            }
        }
        viewModelScope.launch {
            printerConfigRepository.connectionType.collect { type ->
                _uiState.value = _uiState.value.copy(connectionType = type)
            }
        }
        viewModelScope.launch {
            printerConfigRepository.settingsSecurityCodeEnabled.collect { enabled ->
                _uiState.value = _uiState.value.copy(settingsSecurityCodeEnabled = enabled)
            }
        }
        _uiState.value = _uiState.value.copy(
            usbAvailable = usbPrinterDiscovery.hasUsbPrinter(),
        )
        autoDetectPrinter()
        loadSession()
    }

    private fun autoDetectPrinter() {
        viewModelScope.launch {
            val (result, detectedType) = printerConnectionManager.autoDetectAndConnect(appContext)
            val usbConnected = result is com.oneid.totem.data.print.PrintJobResult.Success &&
                detectedType == PrinterConnectionType.USB
            if (usbConnected) {
                printerConfigRepository.setConnectionType(PrinterConnectionType.USB)
            }
            _uiState.value = _uiState.value.copy(usbAvailable = usbConnected)
        }
    }

    private fun loadSession() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = authRepository.validateSession()) {
                is AuthResult.Success -> {
                    _uiState.value = _uiState.value.copy(session = result.session, isLoading = false)
                    prefetchFaceModelIfEnabled(result.session.activeEvent.faceEnabled)
                }
                is AuthResult.Error -> {
                    authRepository.logout()
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message,
                        hasLoggedOut = true,
                    )
                }
            }
        }
    }

    /**
     * O modelo de reconhecimento facial tem 63MB, então só vale a pena baixar quando o
     * evento realmente usa esse método de check-in — num totem só de QR/código isso seria
     * banda jogada fora, o que pesa especialmente em 4G. Esta é a primeira hora em que
     * dá pra saber: a sessão do totem (e com ela o faceEnabled do evento) só chega depois
     * do login.
     *
     * É só um adiantamento: o FaceProcessingServiceImpl chama downloadIfNeeded() de novo
     * ao inicializar, então mesmo se o download falhar aqui a câmera continua funcionando.
     */
    private fun prefetchFaceModelIfEnabled(faceEnabled: Boolean) {
        if (!faceEnabled) return
        if (modelDownloader.isModelDownloaded()) return
        viewModelScope.launch {
            try {
                modelDownloader.downloadIfNeeded()
            } catch (e: Throwable) {
                Log.e("MODEL", "Falha ao baixar modelo facial", e)
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = _uiState.value.copy(hasLoggedOut = true)
        }
    }

    fun isAccessCodeValid(code: String): Boolean {
        val expected = totemPreferences.totemAccessCode
        if (expected.isBlank()) return false
        return code.uppercase().trim() == expected.uppercase().trim()
    }

    fun refresh() {
        loadSession()
    }
}
