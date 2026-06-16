package com.oneid.totem.presentation.screens.feedback

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.print.PrintCoordinator
import com.oneid.totem.data.print.PrintJobResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FeedbackUiState(
    val participantName: String = "",
    val isSuccess: Boolean = true,
    val isPrinting: Boolean = false,
    val printSuccess: Boolean? = null,
    val printError: String? = null,
    val autoReturnDelayMs: Long = 5000L,
)

@HiltViewModel
class FeedbackViewModel @Inject constructor(
    private val printCoordinator: PrintCoordinator,
) : ViewModel() {

    private val _uiState = MutableStateFlow(FeedbackUiState())
    val uiState = _uiState.asStateFlow()

    private var eventParticipantId: String = ""
    private var checkInId: String = ""

    fun initialize(type: String, name: String, eventParticipantId: String = "", checkInId: String = "") {
        _uiState.value = FeedbackUiState(
            participantName = name,
            isSuccess = type == "success",
        )
        this.eventParticipantId = eventParticipantId
        this.checkInId = checkInId
    }

    fun startPrinting() {
        if (eventParticipantId.isBlank()) return
        if (_uiState.value.isPrinting) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPrinting = true)
            when (val result = printCoordinator.printBadge(eventParticipantId, checkInId.ifBlank { null })) {
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
