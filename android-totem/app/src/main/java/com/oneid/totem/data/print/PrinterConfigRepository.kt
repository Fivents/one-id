package com.oneid.totem.data.print

import com.oneid.totem.data.local.TokenStorage
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.domain.repository.AccessCodeKeyboard
import com.oneid.totem.domain.repository.LabelLayout
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PrinterConfigRepository @Inject constructor(
    private val tokenStorage: TokenStorage,
    private val prefs: TotemPreferences,
) {
    private val _printerIp = MutableStateFlow("")
    private val _orientation = MutableStateFlow("PORTRAIT")
    private val _labelLayout = MutableStateFlow(LabelLayout.COMPACT)
    private val _accessCodeKeyboard = MutableStateFlow(AccessCodeKeyboard.ALPHANUMERIC)
    private val _connectionType = MutableStateFlow(PrinterConnectionType.WIFI)
    private val _settingsSecurityCodeEnabled = MutableStateFlow(false)
    private val _checkInHintMessage = MutableStateFlow("")

    val printerIp: StateFlow<String> = _printerIp.asStateFlow()

    val printerIpValue: String get() = _printerIp.value

    val orientation: StateFlow<String> = _orientation.asStateFlow()

    val orientationValue: String get() = _orientation.value

    val labelLayout: StateFlow<LabelLayout> = _labelLayout.asStateFlow()

    val labelLayoutValue: LabelLayout get() = _labelLayout.value

    val accessCodeKeyboard: StateFlow<AccessCodeKeyboard> = _accessCodeKeyboard.asStateFlow()

    val accessCodeKeyboardValue: AccessCodeKeyboard get() = _accessCodeKeyboard.value

    val connectionType: StateFlow<PrinterConnectionType> = _connectionType.asStateFlow()

    val connectionTypeValue: PrinterConnectionType get() = _connectionType.value

    val settingsSecurityCodeEnabled: StateFlow<Boolean> = _settingsSecurityCodeEnabled.asStateFlow()

    val settingsSecurityCodeEnabledValue: Boolean get() = _settingsSecurityCodeEnabled.value

    val checkInHintMessage: StateFlow<String> = _checkInHintMessage.asStateFlow()

    val checkInHintMessageValue: String get() = _checkInHintMessage.value

    fun load() {
        val saved = tokenStorage.getPrinterIp()
        if (!saved.isNullOrBlank()) {
            _printerIp.value = saved
        }
        _orientation.value = prefs.printerOrientation
        _labelLayout.value = prefs.printerLabelLayout
        if (_labelLayout.value == LabelLayout.STANDARD) {
            // O modo Padrão não é mais usado nos eventos; migra totems já configurados
            // com essa preferência antiga para o novo padrão (Compacto).
            setLabelLayout(LabelLayout.COMPACT)
        }
        _accessCodeKeyboard.value = prefs.accessCodeKeyboard
        _connectionType.value = try {
            PrinterConnectionType.valueOf(prefs.printerConnectionType)
        } catch (_: IllegalArgumentException) {
            PrinterConnectionType.WIFI
        }
        _settingsSecurityCodeEnabled.value = prefs.settingsSecurityCodeEnabled
        _checkInHintMessage.value = prefs.checkInHintMessage
    }

    fun setIp(ip: String) {
        val trimmed = ip.trim()
        _printerIp.value = trimmed
        tokenStorage.savePrinterIp(trimmed)
    }

    fun setOrientation(orientation: String) {
        val normalized = if (orientation == "LANDSCAPE") "LANDSCAPE" else "PORTRAIT"
        _orientation.value = normalized
        prefs.printerOrientation = normalized
    }

    fun setLabelLayout(layout: LabelLayout) {
        _labelLayout.value = layout
        prefs.printerLabelLayout = layout
    }

    fun setAccessCodeKeyboard(mode: AccessCodeKeyboard) {
        _accessCodeKeyboard.value = mode
        prefs.accessCodeKeyboard = mode
    }

    fun setConnectionType(type: PrinterConnectionType) {
        _connectionType.value = type
        prefs.printerConnectionType = type.name
    }

    fun setSettingsSecurityCodeEnabled(enabled: Boolean) {
        _settingsSecurityCodeEnabled.value = enabled
        prefs.settingsSecurityCodeEnabled = enabled
    }

    fun setCheckInHintMessage(message: String) {
        // Corta no limite antes de salvar: a dica divide a tela com o campo do código e
        // um texto muito longo empurraria o teclado pra fora da área visível.
        val normalized = message.take(CHECKIN_HINT_MAX_LENGTH)
        _checkInHintMessage.value = normalized
        prefs.checkInHintMessage = normalized
    }

    fun isConfigured(): Boolean {
        return when (_connectionType.value) {
            PrinterConnectionType.USB -> true
            PrinterConnectionType.WIFI -> _printerIp.value.isNotBlank()
        }
    }

    companion object {
        const val CHECKIN_HINT_MAX_LENGTH = 160
    }
}
