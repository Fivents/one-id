package com.oneid.totem.presentation.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.local.TokenStorage
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val key: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
    val showServerDialog: Boolean = false,
    val serverUrl: String = "",
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val tokenStorage: TokenStorage,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState(serverUrl = tokenStorage.getBaseUrl()))
    val uiState = _uiState.asStateFlow()

    init {
        checkExistingSession()
    }

    private fun checkExistingSession() {
        if (!authRepository.isLoggedIn()) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = authRepository.validateSession()) {
                is AuthResult.Success -> _uiState.value = _uiState.value.copy(isLoggedIn = true, isLoading = false)
                is AuthResult.Error -> {
                    authRepository.logout()
                    _uiState.value = _uiState.value.copy(isLoading = false)
                }
            }
        }
    }

    fun onKeyChanged(key: String) {
        _uiState.value = _uiState.value.copy(key = key.uppercase().filter { it.isLetterOrDigit() }, error = null)
    }

    fun login() {
        val key = _uiState.value.key.uppercase().trim()
        if (key.length < 4) {
            _uiState.value = _uiState.value.copy(error = "O código deve ter pelo menos 4 caracteres")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = authRepository.login(key)) {
                is AuthResult.Success -> _uiState.value = _uiState.value.copy(isLoggedIn = true, isLoading = false)
                is AuthResult.Error -> _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
            }
        }
    }

    fun openServerDialog() {
        _uiState.value = _uiState.value.copy(showServerDialog = true, serverUrl = tokenStorage.getBaseUrl())
    }

    fun dismissServerDialog() {
        _uiState.value = _uiState.value.copy(showServerDialog = false)
    }

    fun onServerUrlChanged(url: String) {
        _uiState.value = _uiState.value.copy(serverUrl = url)
    }

    fun saveServerUrl() {
        val url = _uiState.value.serverUrl.trim()
        if (url.isNotBlank()) {
            tokenStorage.saveBaseUrl(url)
            _uiState.value = _uiState.value.copy(showServerDialog = false, error = null)
        }
    }
}
