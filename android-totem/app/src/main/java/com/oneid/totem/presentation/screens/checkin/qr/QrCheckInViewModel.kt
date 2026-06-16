package com.oneid.totem.presentation.screens.checkin.qr

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.service.QrCodeAnalyzer
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QrCheckInUiState(
    val isScanning: Boolean = true,
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: Triple<String, String, String>? = null,
    val torchEnabled: Boolean = false,
    val hasCameraPermission: Boolean? = null,
)

@HiltViewModel
class QrCheckInViewModel @Inject constructor(
    private val checkInRepository: CheckInRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(QrCheckInUiState())
    val uiState = _uiState.asStateFlow()

    private var analyzer: QrCodeAnalyzer? = null

    fun createAnalyzer(): QrCodeAnalyzer {
        return QrCodeAnalyzer(
            onQrDetected = { value -> handleQrDetected(value) },
            onError = { msg -> _uiState.value = _uiState.value.copy(error = msg) },
        ).also { analyzer = it }
    }

    fun checkCameraPermission(context: Context) {
        val hasPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
        _uiState.value = _uiState.value.copy(hasCameraPermission = hasPermission == PackageManager.PERMISSION_GRANTED)
    }

    private fun handleQrDetected(value: String) {
        if (_uiState.value.isLoading) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isScanning = false, isLoading = true, error = null)
            when (val result = checkInRepository.checkInByQr(value)) {
                is CheckInResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        success = Triple(result.data.checkInId, result.data.eventParticipantId, result.data.participant.name),
                    )
                }
                is CheckInResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isScanning = true,
                        error = result.message,
                    )
                }
            }
        }
    }

    fun toggleTorch() {
        _uiState.value = _uiState.value.copy(torchEnabled = !_uiState.value.torchEnabled)
    }

    fun dismissError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun reset() {
        _uiState.value = QrCheckInUiState(hasCameraPermission = true)
    }

    override fun onCleared() {
        super.onCleared()
        analyzer?.stop()
    }
}
