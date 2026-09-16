package com.oneid.totem

import android.app.Application
import android.util.Log
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class OneIdApp : Application() {

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

        // O modelo de reconhecimento facial (63MB) NÃO é baixado aqui. Ele só faz sentido
        // quando o evento tem o check-in por reconhecimento facial ligado, e nesse ponto
        // ainda não sabemos disso — a sessão do totem só é validada depois do login. Quem
        // dispara o download é o MethodViewModel, ao ver event.faceEnabled, e o
        // FaceProcessingServiceImpl garante o download sob demanda se alguém chegar na
        // câmera antes. Assim um totem só com QR/código nunca gasta os 63MB de dados.
    }
}
