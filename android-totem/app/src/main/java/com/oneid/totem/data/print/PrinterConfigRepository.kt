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
    private val _labelLayout = MutableStateFlow(LabelLayout.STANDARD)
    private val _accessCodeKeyboard = MutableStateFlow(AccessCodeKeyboard.ALPHANUMERIC)

    val printerIp: StateFlow<String> = _printerIp.asStateFlow()

    val printerIpValue: String get() = _printerIp.value

    val orientation: StateFlow<String> = _orientation.asStateFlow()

    val orientationValue: String get() = _orientation.value

    val labelLayout: StateFlow<LabelLayout> = _labelLayout.asStateFlow()

    val labelLayoutValue: LabelLayout get() = _labelLayout.value

    val accessCodeKeyboard: StateFlow<AccessCodeKeyboard> = _accessCodeKeyboard.asStateFlow()

    val accessCodeKeyboardValue: AccessCodeKeyboard get() = _accessCodeKeyboard.value

    fun load() {
        val saved = tokenStorage.getPrinterIp()
        if (!saved.isNullOrBlank()) {
            _printerIp.value = saved
        }
        _orientation.value = prefs.printerOrientation
        _labelLayout.value = prefs.printerLabelLayout
        _accessCodeKeyboard.value = prefs.accessCodeKeyboard
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

    fun isConfigured(): Boolean = _printerIp.value.isNotBlank()
}
