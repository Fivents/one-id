package com.oneid.totem.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class CheckInResponse(
    @Json(name = "id") val id: String,
    @Json(name = "confidence") val confidence: Double?,
    @Json(name = "checkedInAt") val checkedInAt: String,
    @Json(name = "eventParticipantId") val eventParticipantId: String,
    @Json(name = "totemEventSubscriptionId") val totemEventSubscriptionId: String,
    @Json(name = "participant") val participant: ParticipantInfo,
)

@JsonClass(generateAdapter = true)
data class SelfRegisterRequest(
    @Json(name = "name") val name: String,
    @Json(name = "email") val email: String,
    @Json(name = "document") val document: String? = null,
    @Json(name = "documentType") val documentType: String? = null,
    @Json(name = "company") val company: String? = null,
    @Json(name = "jobTitle") val jobTitle: String? = null,
)

@JsonClass(generateAdapter = true)
data class SelfRegisterResponse(
    @Json(name = "id") val id: String,
    @Json(name = "eventParticipantId") val eventParticipantId: String,
    @Json(name = "participant") val participant: ParticipantInfo,
)

@JsonClass(generateAdapter = true)
data class FaceCheckInRequest(
    @Json(name = "method") val method: String = "FACE",
    @Json(name = "embedding") val embedding: List<Double>,
    @Json(name = "faceCount") val faceCount: Int = 1,
    @Json(name = "livenessScore") val livenessScore: Double? = null,
    @Json(name = "blinkDetected") val blinkDetected: Boolean? = null,
)

@JsonClass(generateAdapter = true)
data class QrCheckInRequest(
    @Json(name = "method") val method: String = "QR",
    @Json(name = "qrCodeValue") val qrCodeValue: String,
)

@JsonClass(generateAdapter = true)
data class CodeCheckInRequest(
    @Json(name = "method") val method: String = "CODE",
    @Json(name = "accessCode") val accessCode: String,
)

@JsonClass(generateAdapter = true)
data class ParticipantInfo(
    @Json(name = "name") val name: String,
    @Json(name = "company") val company: String?,
    @Json(name = "jobTitle") val jobTitle: String?,
    @Json(name = "imageUrl") val imageUrl: String?,
    @Json(name = "accessCode") val accessCode: String?,
    @Json(name = "qrCodeValue") val qrCodeValue: String?,
)

@JsonClass(generateAdapter = true)
data class ApiError(
    @Json(name = "error") val error: String?,
    @Json(name = "code") val code: String?,
)
