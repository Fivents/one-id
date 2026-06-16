package com.oneid.totem.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PrintRequest(
    @Json(name = "eventParticipantId") val eventParticipantId: String,
    @Json(name = "checkInId") val checkInId: String? = null,
)

@JsonClass(generateAdapter = true)
data class PrintResponse(
    @Json(name = "jobId") val jobId: String,
    @Json(name = "token") val token: String,
    @Json(name = "html") val html: String,
    @Json(name = "paperWidth") val paperWidth: Double,
    @Json(name = "paperHeight") val paperHeight: Double,
    @Json(name = "printerDpi") val printerDpi: Int,
    @Json(name = "copies") val copies: Int,
)

@JsonClass(generateAdapter = true)
data class PrintConfigResponse(
    @Json(name = "id") val id: String,
    @Json(name = "paperWidth") val paperWidth: Double,
    @Json(name = "paperHeight") val paperHeight: Double,
    @Json(name = "orientation") val orientation: String,
    @Json(name = "printerDpi") val printerDpi: Int,
    @Json(name = "copies") val copies: Int,
    @Json(name = "qrCodeContent") val qrCodeContent: String,
    @Json(name = "showQrCode") val showQrCode: Boolean,
    @Json(name = "showAccessCode") val showAccessCode: Boolean,
    @Json(name = "fontSizeName") val fontSizeName: Int,
    @Json(name = "fontSizeMeta") val fontSizeMeta: Int,
)
