package com.oneid.totem.presentation.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import javax.inject.Inject

data class LoginUiState(
    val key: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState = _uiState.asStateFlow()

    private companion object {
        private const val TIMEOUT_MS = 15_000L
    }

    init {
        checkExistingSession()
    }

    private fun checkExistingSession() {
        if (!authRepository.isLoggedIn()) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                withTimeout(TIMEOUT_MS) {
                    when (val result = authRepository.validateSession()) {
                        is AuthResult.Success -> _uiState.value = _uiState.value.copy(isLoggedIn = true, isLoading = false)
                        is AuthResult.Error -> {
                            authRepository.logout()
                            _uiState.value = _uiState.value.copy(isLoading = false)
                        }
                    }
                }
            } catch (_: TimeoutCancellationException) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Tempo limite excedido. Verifique sua conexão.")
            }
        }
    }

    fun onKeyChanged(key: String) {
        _uiState.value = _uiState.value.copy(key = key.uppercase().filter { it.isLetterOrDigit() }, error = null)
    }

    fun login() {
        val key = _uiState.value.key.uppercase().trim()
        if (key.length < 8) {
            _uiState.value = _uiState.value.copy(error = "O código deve ter 8 caracteres")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                withTimeout(TIMEOUT_MS) {
                    when (val result = authRepository.login(key)) {
                        is AuthResult.Success -> _uiState.value = _uiState.value.copy(isLoggedIn = true, isLoading = false)
                        is AuthResult.Error -> _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
                    }
                }
            } catch (_: TimeoutCancellationException) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Tempo limite excedido. Verifique sua conexão.")
            }
        }
    }
}
