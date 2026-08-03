package com.oneid.totem.presentation.screens.checkin.code

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.domain.repository.AccessCodeKeyboard
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CodeCheckInUiState(
    val code: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: Triple<String, String, String>? = null,
    val attemptCount: Int = 0,
    val numericKeyboard: Boolean = false,
)

@HiltViewModel
class CodeCheckInViewModel @Inject constructor(
    private val checkInRepository: CheckInRepository,
    private val totemPreferences: TotemPreferences,
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        CodeCheckInUiState(
            numericKeyboard = totemPreferences.accessCodeKeyboard == AccessCodeKeyboard.NUMERIC,
        ),
    )
    val uiState = _uiState.asStateFlow()

    fun onCodeChanged(code: String) {
        val filtered = if (_uiState.value.numericKeyboard) {
            code.uppercase().filter { it.isDigit() }
        } else {
            code.uppercase().filter { it.isLetterOrDigit() }
        }
        _uiState.value = _uiState.value.copy(code = filtered, error = null)
    }

    fun submitCode() {
        val code = _uiState.value.code.uppercase().trim()
        if (code.length < 4) {
            _uiState.value = _uiState.value.copy(error = "Código muito curto")
            return
        }

        val attempt = _uiState.value.attemptCount + 1
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null, attemptCount = attempt)
            when (val result = checkInRepository.checkInByCode(code)) {
                is CheckInResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        success = Triple(result.data.checkInId, result.data.eventParticipantId, result.data.participant.name),
                    )
                }
                is CheckInResult.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
                    if (attempt >= 3) {
                        kotlinx.coroutines.Job().let {
                            viewModelScope.launch {
                                kotlinx.coroutines.delay(5000)
                                _uiState.value = _uiState.value.copy(error = null)
                            }
                        }
                    }
                }
            }
        }
    }

    fun clearCode() {
        _uiState.value = CodeCheckInUiState()
    }
}
