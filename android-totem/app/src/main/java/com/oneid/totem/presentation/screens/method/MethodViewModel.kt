package com.oneid.totem.presentation.screens.method

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.data.service.ModelDownloadState
import com.oneid.totem.data.service.ModelDownloader
import com.oneid.totem.domain.model.TotemSession
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MethodUiState(
    val session: TotemSession? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
    val hasLoggedOut: Boolean = false,
    val printerIp: String = "",
)

@HiltViewModel
class MethodViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val printerConfigRepository: PrinterConfigRepository,
    private val modelDownloader: ModelDownloader,
    private val totemPreferences: TotemPreferences,
) : ViewModel() {

    private val _uiState = MutableStateFlow(MethodUiState())
    val uiState = _uiState.asStateFlow()

    val modelDownloadState: StateFlow<ModelDownloadState> = modelDownloader.downloadState

    init {
        printerConfigRepository.load()
        viewModelScope.launch {
            printerConfigRepository.printerIp.collect { ip ->
                _uiState.value = _uiState.value.copy(printerIp = ip)
            }
        }
        loadSession()
    }

    private fun loadSession() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = authRepository.validateSession()) {
                is AuthResult.Success -> _uiState.value = _uiState.value.copy(session = result.session, isLoading = false)
                is AuthResult.Error -> {
                    authRepository.logout()
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message,
                        hasLoggedOut = true,
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = _uiState.value.copy(hasLoggedOut = true)
        }
    }

    fun isAccessCodeValid(code: String): Boolean {
        val expected = totemPreferences.totemAccessCode
        if (expected.isBlank()) return false
        return code.uppercase().trim() == expected.uppercase().trim()
    }

    fun refresh() {
        loadSession()
    }
}
