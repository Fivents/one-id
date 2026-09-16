package com.oneid.totem.presentation.screens.feedback

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.print.PrintCoordinator
import com.oneid.totem.data.print.PrintJobResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import javax.inject.Inject

enum class FeedbackKind {
    /** Check-in concluído: imprime o badge. */
    CHECKED_IN,

    /** Auto-cadastro sem check-in automático: mostra o código de acesso, não imprime. */
    REGISTERED,

    FAILED,
    ;

    companion object {
        fun from(type: String): FeedbackKind = when (type) {
            "registered" -> REGISTERED
            "success" -> CHECKED_IN
            else -> FAILED
        }
    }
}

data class FeedbackUiState(
    val participantName: String = "",
    val kind: FeedbackKind = FeedbackKind.CHECKED_IN,
    val accessCode: String = "",
    val isPrinting: Boolean = false,
    val printSuccess: Boolean? = null,
    val printError: String? = null,
    val autoReturnDelayMs: Long = 5000L,
) {
    val isSuccess: Boolean get() = kind != FeedbackKind.FAILED
}

@HiltViewModel
class FeedbackViewModel @Inject constructor(
    private val printCoordinator: PrintCoordinator,
) : ViewModel() {

    private val _uiState = MutableStateFlow(FeedbackUiState())
    val uiState = _uiState.asStateFlow()

    private var eventParticipantId: String = ""
    private var checkInId: String = ""

    fun initialize(
        type: String,
        name: String,
        eventParticipantId: String = "",
        checkInId: String = "",
        accessCode: String = "",
    ) {
        _uiState.value = FeedbackUiState(
            participantName = name,
            kind = FeedbackKind.from(type),
            accessCode = accessCode,
        )
        this.eventParticipantId = eventParticipantId
        this.checkInId = checkInId
    }

    fun startPrinting() {
        // Cadastro sem check-in não gera badge: a pessoa recebe o badge quando voltar pra
        // fazer o check-in de verdade.
        if (_uiState.value.kind != FeedbackKind.CHECKED_IN) return
        if (eventParticipantId.isBlank()) return
        if (_uiState.value.isPrinting) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPrinting = true)
            val result = try {
                withTimeout(30_000) {
                    printCoordinator.printBadge(eventParticipantId, checkInId.ifBlank { null })
                }
            } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
                PrintJobResult.Error("Tempo limite de impressão excedido (30s)")
            } catch (e: Throwable) {
                // Throwable: falhas da lib nativa da Brother chegam como Error e escapariam
                // de um catch de Exception, derrubando o app no meio do check-in.
                PrintJobResult.Error("Erro inesperado: ${e.message}")
            }

            when (result) {
                is PrintJobResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isPrinting = false,
                        printSuccess = true,
                    )
                }
                is PrintJobResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isPrinting = false,
                        printSuccess = false,
                        printError = result.message,
                    )
                }
            }
        }
    }
}
