package com.oneid.totem.domain.repository

import com.oneid.totem.domain.model.SelfRegistration
import com.oneid.totem.domain.model.CheckInResult as CheckInResultModel

sealed class CheckInResult {
    data class Success(val data: CheckInResultModel) : CheckInResult()
    data class Error(val code: String, val message: String) : CheckInResult()
}

sealed class SelfRegisterResult {
    data class Success(val data: SelfRegistration) : SelfRegisterResult()
    data class Error(val code: String, val message: String) : SelfRegisterResult()
}

interface CheckInRepository {
    suspend fun checkInByCode(accessCode: String): CheckInResult
    suspend fun checkInByQr(qrCodeValue: String): CheckInResult
    suspend fun checkInByFace(embedding: List<Double>, livenessScore: Double? = null, blinkDetected: Boolean? = null): CheckInResult

    /**
     * Inscreve a pessoa no evento ativo do totem. Com [autoCheckIn] o check-in sai junto,
     * numa interação só; sem ele a pessoa fica só cadastrada e faz o check-in depois.
     */
    suspend fun selfRegister(
        name: String,
        email: String,
        document: String? = null,
        phone: String? = null,
        company: String? = null,
        jobTitle: String? = null,
        autoCheckIn: Boolean = true,
    ): SelfRegisterResult
}
