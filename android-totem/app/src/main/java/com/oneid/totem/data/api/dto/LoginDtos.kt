package com.oneid.totem.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LoginRequest(
    @Json(name = "key") val key: String,
)

@JsonClass(generateAdapter = true)
data class LoginResponse(
    @Json(name = "token") val token: String,
    @Json(name = "totem") val totem: TotemInfo,
    @Json(name = "activeEvent") val activeEvent: EventConfig,
    @Json(name = "totemEventSubscriptionId") val totemEventSubscriptionId: String,
    @Json(name = "aiConfig") val aiConfig: AIConfig,
)

@JsonClass(generateAdapter = true)
data class SessionResponse(
    @Json(name = "sessionId") val sessionId: String,
    @Json(name = "expiresAt") val expiresAt: String,
    @Json(name = "totem") val totem: TotemInfo,
    @Json(name = "activeEvent") val activeEvent: EventConfig,
    @Json(name = "totemEventSubscriptionId") val totemEventSubscriptionId: String,
    @Json(name = "aiConfig") val aiConfig: AIConfig,
)

@JsonClass(generateAdapter = true)
data class TotemInfo(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
)

@JsonClass(generateAdapter = true)
data class EventConfig(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "startsAt") val startsAt: String,
    @Json(name = "endsAt") val endsAt: String,
    @Json(name = "faceEnabled") val faceEnabled: Boolean,
    @Json(name = "qrEnabled") val qrEnabled: Boolean,
    @Json(name = "codeEnabled") val codeEnabled: Boolean,
    @Json(name = "allowSelfRegistration") val allowSelfRegistration: Boolean,
    @Json(name = "hasPrintConfig") val hasPrintConfig: Boolean,
    @Json(name = "labelPrintPromptEnabled") val labelPrintPromptEnabled: Boolean,
    @Json(name = "labelPrintPromptTimeoutSeconds") val labelPrintPromptTimeoutSeconds: Int,
)

@JsonClass(generateAdapter = true)
data class AIConfig(
    @Json(name = "confidenceThreshold") val confidenceThreshold: Double,
    @Json(name = "detectionIntervalMs") val detectionIntervalMs: Int,
    @Json(name = "maxFaces") val maxFaces: Int,
    @Json(name = "livenessDetection") val livenessDetection: Boolean,
    @Json(name = "livenessThreshold") val livenessThreshold: Double,
    @Json(name = "minFaceSize") val minFaceSize: Int,
    @Json(name = "cooldownSeconds") val cooldownSeconds: Int,
    @Json(name = "efSearch") val efSearch: Int,
    @Json(name = "topKCandidates") val topKCandidates: Int,
)
