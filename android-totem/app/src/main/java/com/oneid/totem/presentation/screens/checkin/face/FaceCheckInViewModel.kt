package com.oneid.totem.presentation.screens.checkin.face

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.service.CameraFaceAnalyzer
import com.oneid.totem.data.service.FaceProcessingService
import com.oneid.totem.domain.model.FaceDetectionResult
import com.oneid.totem.domain.model.FaceProcessingConfig
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FaceCheckInUiState(
    val isDetecting: Boolean = true,
    val isLoading: Boolean = false,
    val faceDetected: Boolean = false,
    val faceInFrame: Boolean = false,
    val error: String? = null,
    val success: Triple<String, String, String>? = null,
    val hasCameraPermission: Boolean? = null,
)

@HiltViewModel
class FaceCheckInViewModel @Inject constructor(
    private val checkInRepository: CheckInRepository,
    private val faceProcessingService: FaceProcessingService,
) : ViewModel() {

    private val _uiState = MutableStateFlow(FaceCheckInUiState())
    val uiState = _uiState.asStateFlow()

    private var analyzer: CameraFaceAnalyzer? = null
    private var cooldownUntil = 0L

    private val processingConfig = FaceProcessingConfig(
        minFaceSize = 200,
        maxFaces = 1,
        livenessEnabled = true,
        livenessThreshold = 0.5,
        cooldownMs = 1500,
    )

    fun createAnalyzer(): CameraFaceAnalyzer {
        return CameraFaceAnalyzer(
            faceProcessingService = faceProcessingService,
            config = processingConfig,
            onFaceResult = { result -> handleFaceResult(result) },
        ).also { analyzer = it }
    }

    fun checkCameraPermission(context: Context) {
        val hasPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.CAMERA,
        ) == PackageManager.PERMISSION_GRANTED
        _uiState.value = _uiState.value.copy(hasCameraPermission = hasPermission)
    }

    private fun handleFaceResult(result: FaceDetectionResult?) {
        val now = System.currentTimeMillis()
        if (now < cooldownUntil) return

        if (result == null) {
            _uiState.value = _uiState.value.copy(faceInFrame = false, isDetecting = true)
            return
        }

        _uiState.value = _uiState.value.copy(faceInFrame = true)

        if (result.embedding.isEmpty()) {
            if (result.livenessResult.passed) {
                _uiState.value = _uiState.value.copy(faceDetected = true, isDetecting = false)
            }
            return
        }

        _uiState.value = _uiState.value.copy(faceDetected = true, isDetecting = false, isLoading = true)
        cooldownUntil = now + 5000

        viewModelScope.launch {
            delay(400)

            when (val apiResult = checkInRepository.checkInByFace(
                embedding = result.embedding,
                livenessScore = result.livenessResult.score,
                blinkDetected = result.livenessResult.blinkDetected,
            )) {
                is CheckInResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        success = Triple(apiResult.data.checkInId, apiResult.data.eventParticipantId, apiResult.data.participant.name),
                    )
                }
                is CheckInResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isDetecting = true,
                        faceDetected = false,
                        error = apiResult.message,
                    )
                }
            }
        }
    }

    fun dismissError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun reset() {
        _uiState.value = FaceCheckInUiState(hasCameraPermission = true)
        cooldownUntil = 0L
    }

    override fun onCleared() {
        super.onCleared()
        analyzer?.stop()
    }
}
