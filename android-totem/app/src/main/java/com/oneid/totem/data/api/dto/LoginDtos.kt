package com.oneid.totem.data.api.dto

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("key") val key: String,
)

data class LoginResponse(
    @SerializedName("token") val token: String,
    @SerializedName("totem") val totem: TotemDto,
    @SerializedName("activeEvent") val activeEvent: ActiveEventDto,
    @SerializedName("totemEventSubscriptionId") val totemEventSubscriptionId: String,
    @SerializedName("aiConfig") val aiConfig: AIConfigDto,
)

data class TotemDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
)

data class ActiveEventDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("startsAt") val startsAt: String,
    @SerializedName("endsAt") val endsAt: String,
    @SerializedName("faceEnabled") val faceEnabled: Boolean,
    @SerializedName("qrEnabled") val qrEnabled: Boolean,
    @SerializedName("codeEnabled") val codeEnabled: Boolean,
    @SerializedName("allowSelfRegistration") val allowSelfRegistration: Boolean,
    @SerializedName("hasPrintConfig") val hasPrintConfig: Boolean,
    @SerializedName("labelPrintPromptEnabled") val labelPrintPromptEnabled: Boolean? = false,
    @SerializedName("labelPrintPromptTimeoutSeconds") val labelPrintPromptTimeoutSeconds: Int? = 15,
)

data class AIConfigDto(
    @SerializedName("confidenceThreshold") val confidenceThreshold: Double,
    @SerializedName("detectionIntervalMs") val detectionIntervalMs: Int? = 500,
    @SerializedName("maxFaces") val maxFaces: Int? = 1,
    @SerializedName("livenessDetection") val livenessDetection: Boolean? = true,
    @SerializedName("livenessThreshold") val livenessThreshold: Double? = 0.7,
    @SerializedName("minFaceSize") val minFaceSize: Int? = 56,
    @SerializedName("cooldownSeconds") val cooldownSeconds: Int? = 8,
    @SerializedName("efSearch") val efSearch: Int? = 64,
    @SerializedName("topKCandidates") val topKCandidates: Int? = 5,
)
