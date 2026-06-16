package com.oneid.totem.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class EventConfigResponse(
    @Json(name = "eventId") val eventId: String,
    @Json(name = "eventName") val eventName: String,
    @Json(name = "eventStartsAt") val eventStartsAt: String,
    @Json(name = "eventEndsAt") val eventEndsAt: String,
    @Json(name = "checkinMethods") val checkinMethods: CheckinMethodsConfig,
    @Json(name = "confidenceThreshold") val confidenceThreshold: Double,
    @Json(name = "detectionIntervalMs") val detectionIntervalMs: Int,
    @Json(name = "maxFaces") val maxFaces: Int,
    @Json(name = "minFaceSize") val minFaceSize: Int,
    @Json(name = "livenessEnabled") val livenessEnabled: Boolean,
    @Json(name = "livenessThreshold") val livenessThreshold: Double,
    @Json(name = "efSearch") val efSearch: Int,
    @Json(name = "topKCandidates") val topKCandidates: Int,
    @Json(name = "cooldownSeconds") val cooldownSeconds: Int,
    @Json(name = "generatedAt") val generatedAt: String,
)

@JsonClass(generateAdapter = true)
data class CheckinMethodsConfig(
    @Json(name = "faceEnabled") val faceEnabled: Boolean,
    @Json(name = "qrEnabled") val qrEnabled: Boolean,
    @Json(name = "codeEnabled") val codeEnabled: Boolean,
)
