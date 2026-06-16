package com.oneid.totem.domain.repository

import com.oneid.totem.domain.model.CheckInResult as CheckInResultModel

sealed class CheckInResult {
    data class Success(val data: CheckInResultModel) : CheckInResult()
    data class Error(val code: String, val message: String) : CheckInResult()
}

interface CheckInRepository {
    suspend fun checkInByCode(accessCode: String): CheckInResult
    suspend fun checkInByQr(qrCodeValue: String): CheckInResult
    suspend fun checkInByFace(embedding: List<Double>, livenessScore: Double? = null, blinkDetected: Boolean? = null): CheckInResult
    suspend fun selfRegister(name: String, email: String, document: String? = null, company: String? = null, jobTitle: String? = null): CheckInResult
}
