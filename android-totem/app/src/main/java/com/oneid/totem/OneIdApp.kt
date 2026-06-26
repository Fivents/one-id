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

        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("CRASH", "Unhandled exception on thread: ${thread.name}", throwable)
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
