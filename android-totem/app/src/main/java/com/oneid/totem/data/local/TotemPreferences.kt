package com.oneid.totem.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.oneid.totem.data.db.DatabaseConfig
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

    var dbHost: String
        get() = prefs.getString(KEY_DB_HOST, "localhost") ?: "localhost"
        set(value) = prefs.edit().putString(KEY_DB_HOST, value).apply()

    var dbPort: Int
        get() = prefs.getInt(KEY_DB_PORT, 5432)
        set(value) = prefs.edit().putInt(KEY_DB_PORT, value).apply()

    var dbName: String
        get() = prefs.getString(KEY_DB_NAME, "fivents") ?: "fivents"
        set(value) = prefs.edit().putString(KEY_DB_NAME, value).apply()

    var dbUser: String
        get() = prefs.getString(KEY_DB_USER, "postgres") ?: "postgres"
        set(value) = prefs.edit().putString(KEY_DB_USER, value).apply()

    var dbPassword: String
        get() = prefs.getString(KEY_DB_PASSWORD, "") ?: ""
        set(value) = prefs.edit().putString(KEY_DB_PASSWORD, value).apply()

    var dbSslMode: String
        get() = prefs.getString(KEY_DB_SSL, "require") ?: "require"
        set(value) = prefs.edit().putString(KEY_DB_SSL, value).apply()

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

    fun toDatabaseConfig(): DatabaseConfig = DatabaseConfig(
        host = dbHost,
        port = dbPort,
        database = dbName,
        user = dbUser,
        password = dbPassword,
        sslMode = dbSslMode,
    )

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
        val savedDbHost = dbHost
        val savedDbPort = dbPort
        val savedDbName = dbName
        val savedDbUser = dbUser
        val savedDbPassword = dbPassword
        val savedDbSsl = dbSslMode
        val savedPrinterIp = printerIp
        prefs.edit().clear().apply()
        dbHost = savedDbHost
        dbPort = savedDbPort
        dbName = savedDbName
        dbUser = savedDbUser
        dbPassword = savedDbPassword
        dbSslMode = savedDbSsl
        printerIp = savedPrinterIp
    }

    companion object {
        private const val PREFS_NAME = "oneid_totem_config"
        private const val KEY_DB_HOST = "db_host"
        private const val KEY_DB_PORT = "db_port"
        private const val KEY_DB_NAME = "db_name"
        private const val KEY_DB_USER = "db_user"
        private const val KEY_DB_PASSWORD = "db_password"
        private const val KEY_DB_SSL = "db_ssl"
        private const val KEY_TOTEM_ACCESS_CODE = "totem_access_code"
        private const val KEY_TOTEM_ID = "totem_id"
        private const val KEY_TOTEM_NAME = "totem_name"
        private const val KEY_PRINTER_IP = "printer_ip"
        private const val KEY_ACTIVE_EVENT_ID = "active_event_id"
        private const val KEY_EVENT_NAME = "event_name"
        private const val KEY_TOTEM_EVENT_SUB_ID = "totem_event_sub_id"
    }
}
