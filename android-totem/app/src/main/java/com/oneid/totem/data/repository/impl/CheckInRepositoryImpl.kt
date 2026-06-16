package com.oneid.totem.data.repository.impl

import com.oneid.totem.data.api.TotemApi
import com.oneid.totem.data.api.dto.*
import com.oneid.totem.domain.model.ParticipantInfo
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import javax.inject.Inject

class CheckInRepositoryImpl @Inject constructor(
    private val api: TotemApi,
) : CheckInRepository {

    override suspend fun checkInByCode(accessCode: String): CheckInResult {
        return try {
            val response = api.codeCheckIn(CodeCheckInRequest(accessCode = accessCode.uppercase()))
            handleCheckInResponse(response)
        } catch (e: Exception) {
            CheckInResult.Error("NETWORK_ERROR", e.message ?: "Network error")
        }
    }

    override suspend fun checkInByQr(qrCodeValue: String): CheckInResult {
        return try {
            val response = api.qrCheckIn(QrCheckInRequest(qrCodeValue = qrCodeValue))
            handleCheckInResponse(response)
        } catch (e: Exception) {
            CheckInResult.Error("NETWORK_ERROR", e.message ?: "Network error")
        }
    }

    override suspend fun checkInByFace(
        embedding: List<Double>,
        livenessScore: Double?,
        blinkDetected: Boolean?,
    ): CheckInResult {
        return try {
            val response = api.faceCheckIn(
                FaceCheckInRequest(
                    embedding = embedding,
                    faceCount = 1,
                    livenessScore = livenessScore,
                    blinkDetected = blinkDetected,
                )
            )
            handleCheckInResponse(response)
        } catch (e: Exception) {
            CheckInResult.Error("NETWORK_ERROR", e.message ?: "Network error")
        }
    }

    override suspend fun selfRegister(
        name: String,
        email: String,
        document: String?,
        company: String?,
        jobTitle: String?,
    ): CheckInResult {
        return try {
            val response = api.selfRegister(
                SelfRegisterRequest(
                    name = name,
                    email = email,
                    document = document,
                    company = company,
                    jobTitle = jobTitle,
                )
            )
            if (response.isSuccessful) {
                val body = response.body()!!
                CheckInResult.Success(
                    com.oneid.totem.domain.model.CheckInResult(
                        checkInId = body.id,
                        eventParticipantId = body.eventParticipantId,
                        participant = ParticipantInfo(
                            name = body.participant.name,
                            company = body.participant.company,
                            jobTitle = body.participant.jobTitle,
                            imageUrl = body.participant.imageUrl,
                            accessCode = body.participant.accessCode,
                            qrCodeValue = body.participant.qrCodeValue,
                        ),
                    )
                )
            } else {
                val err = parseError(response.errorBody()?.string())
                CheckInResult.Error(err.first, err.second)
            }
        } catch (e: Exception) {
            CheckInResult.Error("NETWORK_ERROR", e.message ?: "Network error")
        }
    }

    private suspend fun handleCheckInResponse(response: retrofit2.Response<CheckInResponse>): CheckInResult {
        return if (response.isSuccessful) {
            val body = response.body()!!
                CheckInResult.Success(
                    com.oneid.totem.domain.model.CheckInResult(
                        checkInId = body.id,
                        eventParticipantId = body.eventParticipantId,
                        participant = ParticipantInfo(
                            name = body.participant.name,
                            company = body.participant.company,
                            jobTitle = body.participant.jobTitle,
                            imageUrl = body.participant.imageUrl,
                            accessCode = body.participant.accessCode,
                            qrCodeValue = body.participant.qrCodeValue,
                        ),
                    )
                )
            } else {
                val err = parseError(response.errorBody()?.string())
                CheckInResult.Error(err.first, err.second)
        }
    }

    private fun parseError(errorBody: String?): Pair<String, String> {
        if (errorBody == null) return "UNKNOWN" to "Unknown error"
        return try {
            val moshi = com.squareup.moshi.Moshi.Builder().build()
            val adapter = moshi.adapter(ApiError::class.java)
            val apiError = adapter.fromJson(errorBody)
            (apiError?.code ?: "UNKNOWN") to (apiError?.error ?: errorBody)
        } catch (_: Exception) {
            "UNKNOWN" to errorBody
        }
    }
}
