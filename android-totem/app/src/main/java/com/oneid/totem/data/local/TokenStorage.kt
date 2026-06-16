package com.oneid.totem.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenStorage @Inject constructor(
    @ApplicationContext context: Context,
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun clearToken() {
        prefs.edit().remove(KEY_TOKEN).apply()
    }

    fun saveTotemInfo(id: String, name: String) {
        prefs.edit()
            .putString(KEY_TOTEM_ID, id)
            .putString(KEY_TOTEM_NAME, name)
            .apply()
    }

    fun getTotemId(): String? = prefs.getString(KEY_TOTEM_ID, null)

    fun getTotemName(): String? = prefs.getString(KEY_TOTEM_NAME, null)

    fun saveBaseUrl(url: String) {
        prefs.edit().putString(KEY_BASE_URL, url).apply()
    }

    fun getBaseUrl(): String = prefs.getString(KEY_BASE_URL, "http://10.0.2.2:3000") ?: "http://10.0.2.2:3000"

    fun savePrinterIp(ip: String) {
        prefs.edit().putString(KEY_PRINTER_IP, ip).apply()
    }

    fun getPrinterIp(): String? = prefs.getString(KEY_PRINTER_IP, null)

    companion object {
        private const val PREFS_NAME = "oneid_totem_secure_prefs"
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_TOTEM_ID = "totem_id"
        private const val KEY_TOTEM_NAME = "totem_name"
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_PRINTER_IP = "printer_ip"
    }
}
