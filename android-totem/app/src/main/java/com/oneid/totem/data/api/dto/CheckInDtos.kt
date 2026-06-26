package com.oneid.totem.data.api.dto

import com.google.gson.annotations.SerializedName

data class FaceCheckInRequest(
    @SerializedName("method") val method: String = "FACE",
    @SerializedName("embedding") val embedding: List<Double>,
    @SerializedName("faceCount") val faceCount: Int? = 1,
    @SerializedName("livenessScore") val livenessScore: Double? = null,
    @SerializedName("blinkDetected") val blinkDetected: Boolean? = null,
)

data class CodeCheckInRequest(
    @SerializedName("method") val method: String = "CODE",
    @SerializedName("accessCode") val accessCode: String,
)

data class QrCheckInRequest(
    @SerializedName("method") val method: String = "QR",
    @SerializedName("qrCodeValue") val qrCodeValue: String,
)

data class CheckInResponse(
    @SerializedName("id") val id: String,
    @SerializedName("confidence") val confidence: Double?,
    @SerializedName("checkedInAt") val checkedInAt: String?,
    @SerializedName("eventParticipantId") val eventParticipantId: String,
    @SerializedName("totemEventSubscriptionId") val totemEventSubscriptionId: String?,
    @SerializedName("participant") val participant: ParticipantDto,
)

data class ParticipantDto(
    @SerializedName("name") val name: String,
    @SerializedName("company") val company: String?,
    @SerializedName("jobTitle") val jobTitle: String?,
    @SerializedName("imageUrl") val imageUrl: String?,
    @SerializedName("accessCode") val accessCode: String?,
    @SerializedName("qrCodeValue") val qrCodeValue: String?,
)

data class CheckInErrorResponse(
    @SerializedName("error") val error: String,
    @SerializedName("code") val code: String? = null,
    @SerializedName("confidence") val confidence: Double? = null,
    @SerializedName("threshold") val threshold: Double? = null,
)
