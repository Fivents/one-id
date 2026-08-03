package com.oneid.totem.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.oneid.totem.domain.repository.AccessCodeKeyboard
import com.oneid.totem.domain.repository.LabelLayout
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TotemPreferences @Inject constructor(
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

    var totemAccessCode: String
        get() = prefs.getString(KEY_TOTEM_ACCESS_CODE, "") ?: ""
        set(value) = prefs.edit().putString(KEY_TOTEM_ACCESS_CODE, value).apply()

    var totemId: String
        get() = prefs.getString(KEY_TOTEM_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_TOTEM_ID, value).apply()

    var totemName: String
        get() = prefs.getString(KEY_TOTEM_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_TOTEM_NAME, value).apply()

    var printerIp: String
        get() = prefs.getString(KEY_PRINTER_IP, "") ?: ""
        set(value) = prefs.edit().putString(KEY_PRINTER_IP, value).apply()

    var printerOrientation: String
        get() = prefs.getString(KEY_PRINTER_ORIENTATION, "PORTRAIT") ?: "PORTRAIT"
        set(value) = prefs.edit().putString(KEY_PRINTER_ORIENTATION, value).apply()

    var printerLabelLayout: LabelLayout
        get() = try {
            LabelLayout.valueOf(prefs.getString(KEY_PRINTER_LABEL_LAYOUT, LabelLayout.STANDARD.name) ?: LabelLayout.STANDARD.name)
        } catch (_: IllegalArgumentException) {
            LabelLayout.STANDARD
        }
        set(value) = prefs.edit().putString(KEY_PRINTER_LABEL_LAYOUT, value.name).apply()

    var accessCodeKeyboard: AccessCodeKeyboard
        get() = try {
            AccessCodeKeyboard.valueOf(prefs.getString(KEY_ACCESS_CODE_KEYBOARD, AccessCodeKeyboard.ALPHANUMERIC.name) ?: AccessCodeKeyboard.ALPHANUMERIC.name)
        } catch (_: IllegalArgumentException) {
            AccessCodeKeyboard.ALPHANUMERIC
        }
        set(value) = prefs.edit().putString(KEY_ACCESS_CODE_KEYBOARD, value.name).apply()

    var activeEventId: String
        get() = prefs.getString(KEY_ACTIVE_EVENT_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_ACTIVE_EVENT_ID, value).apply()

    var eventName: String
        get() = prefs.getString(KEY_EVENT_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_EVENT_NAME, value).apply()

    var totemEventSubscriptionId: String
        get() = prefs.getString(KEY_TOTEM_EVENT_SUB_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_TOTEM_EVENT_SUB_ID, value).apply()

    val isLoggedIn: Boolean
        get() = totemAccessCode.isNotBlank() && totemId.isNotBlank()

    fun saveTotemSession(
        totemId: String,
        totemName: String,
        eventId: String,
        eventName: String,
        totemEventSubscriptionId: String,
    ) {
        this.totemId = totemId
        this.totemName = totemName
        this.activeEventId = eventId
        this.eventName = eventName
        this.totemEventSubscriptionId = totemEventSubscriptionId
    }

    fun clearSession() {
        val savedPrinterIp = printerIp
        prefs.edit().clear().apply()
        printerIp = savedPrinterIp
    }

    companion object {
        private const val PREFS_NAME = "oneid_totem_config"
        private const val KEY_TOTEM_ACCESS_CODE = "totem_access_code"
        private const val KEY_TOTEM_ID = "totem_id"
        private const val KEY_TOTEM_NAME = "totem_name"
        private const val KEY_PRINTER_IP = "printer_ip"
        private const val KEY_PRINTER_ORIENTATION = "printer_orientation"
        private const val KEY_PRINTER_LABEL_LAYOUT = "printer_label_layout"
        private const val KEY_ACCESS_CODE_KEYBOARD = "access_code_keyboard"
        private const val KEY_ACTIVE_EVENT_ID = "active_event_id"
        private const val KEY_EVENT_NAME = "event_name"
        private const val KEY_TOTEM_EVENT_SUB_ID = "totem_event_sub_id"
    }
}
