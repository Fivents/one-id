package com.oneid.totem

import android.app.Application
import android.util.Log
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

    @Inject lateinit var modelDownloader: ModelDownloader

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()

        // Engolir a exceção aqui (só logar e retornar) não "salvava" o app: sem o handler
        // padrão do Android, a thread morre sem ninguém encerrar o processo direito — na
        // main thread isso fazia o app simplesmente sumir da tela, sem diálogo nem relatório
        // de erro. Logamos e repassamos pro handler original, que encerra o processo do
        // jeito normal e registra o crash.
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("CRASH", "Unhandled exception on thread: ${thread.name}", throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }

        startModelDownload()
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
