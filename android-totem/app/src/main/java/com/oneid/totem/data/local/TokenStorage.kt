package com.oneid.totem.data.local

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenStorage @Inject constructor(
    private val prefs: TotemPreferences,
) {
    fun saveTotemInfo(totemId: String, totemName: String) {
        prefs.totemId = totemId
        prefs.totemName = totemName
    }

    fun saveToken(tesId: String) {
        prefs.totemEventSubscriptionId = tesId
    }

    fun getToken(): String? = prefs.totemEventSubscriptionId.ifBlank { null }

    fun getTotemId(): String? = prefs.totemId.ifBlank { null }

    fun clearToken() {
        prefs.clearSession()
    }

    fun getPrinterIp(): String? = prefs.printerIp.ifBlank { null }

    fun savePrinterIp(ip: String) {
        prefs.printerIp = ip
    }
}
