package com.oneid.totem.data.print

import com.oneid.totem.data.local.TokenStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PrinterConfigRepository @Inject constructor(
    private val tokenStorage: TokenStorage,
) {
    private val _printerIp = MutableStateFlow("")

    val printerIp: StateFlow<String> = _printerIp.asStateFlow()

    val printerIpValue: String get() = _printerIp.value

    fun load() {
        val saved = tokenStorage.getPrinterIp()
        if (!saved.isNullOrBlank()) {
            _printerIp.value = saved
        }
    }

    fun setIp(ip: String) {
        val trimmed = ip.trim()
        _printerIp.value = trimmed
        tokenStorage.savePrinterIp(trimmed)
    }

    fun isConfigured(): Boolean = _printerIp.value.isNotBlank()
}
