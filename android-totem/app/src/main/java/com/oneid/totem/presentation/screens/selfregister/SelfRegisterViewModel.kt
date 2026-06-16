package com.oneid.totem.presentation.screens.selfregister

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SelfRegisterUiState(
    val name: String = "",
    val email: String = "",
    val company: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: Triple<String, String, String>? = null, // checkInId, eventParticipantId, participantName
)

@HiltViewModel
class SelfRegisterViewModel @Inject constructor(
    private val checkInRepository: CheckInRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SelfRegisterUiState())
    val uiState = _uiState.asStateFlow()

    fun onNameChanged(name: String) {
        _uiState.value = _uiState.value.copy(name = name, error = null)
    }

    fun onEmailChanged(email: String) {
        _uiState.value = _uiState.value.copy(email = email, error = null)
    }

    fun onCompanyChanged(company: String) {
        _uiState.value = _uiState.value.copy(company = company, error = null)
    }

    fun submit() {
        val state = _uiState.value
        if (state.name.isBlank()) {
            _uiState.value = state.copy(error = "Nome é obrigatório")
            return
        }
        if (state.email.isBlank() || !state.email.contains("@")) {
            _uiState.value = state.copy(error = "Email inválido")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = checkInRepository.selfRegister(
                name = state.name.trim(),
                email = state.email.trim(),
                company = state.company.trim().ifBlank { null },
            )) {
                is CheckInResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        success = Triple(result.data.checkInId, result.data.eventParticipantId, result.data.participant.name),
                    )
                }
                is CheckInResult.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
                }
            }
        }
    }
}
