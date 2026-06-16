package com.oneid.totem

import android.app.Application
import android.util.Log
import com.oneid.totem.data.db.DatabaseConfig
import com.oneid.totem.data.db.DatabaseManager
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.data.service.ModelDownloader
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class OneIdApp : Application() {

    @Inject lateinit var databaseManager: DatabaseManager
    @Inject lateinit var prefs: TotemPreferences
    @Inject lateinit var modelDownloader: ModelDownloader

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()

        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("CRASH", "Unhandled exception on thread: ${thread.name}", throwable)
        }

        configureDatabase()
        startModelDownload()
    }

    private fun configureDatabase() {
        try {
            val fromBuildConfig = DatabaseConfig(
                host = BuildConfig.DB_HOST,
                port = BuildConfig.DB_PORT.toIntOrNull() ?: 5432,
                database = BuildConfig.DB_NAME,
                user = BuildConfig.DB_USER,
                password = BuildConfig.DB_PASSWORD,
                sslMode = BuildConfig.DB_SSL,
            )

            val config = if (fromBuildConfig.host == "localhost" && fromBuildConfig.password.isBlank()) {
                prefs.toDatabaseConfig()
            } else {
                prefs.dbHost = fromBuildConfig.host
                prefs.dbPort = fromBuildConfig.port
                prefs.dbName = fromBuildConfig.database
                prefs.dbUser = fromBuildConfig.user
                prefs.dbPassword = fromBuildConfig.password
                prefs.dbSslMode = fromBuildConfig.sslMode
                fromBuildConfig
            }

            databaseManager.configure(config)
            Log.d("DB", "Configurado: ${config.host}:${config.port}/${config.database}")
        } catch (e: Exception) {
            Log.e("DB", "Falha ao configurar banco", e)
        }
    }

    private fun startModelDownload() {
        appScope.launch {
            try {
                modelDownloader.downloadIfNeeded()
            } catch (e: Exception) {
                Log.e("MODEL", "Falha ao baixar modelo facial", e)
            }
        }
    }
}
