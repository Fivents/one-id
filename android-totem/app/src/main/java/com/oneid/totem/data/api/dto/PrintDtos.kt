package com.oneid.totem.data.api.dto

import com.google.gson.annotations.SerializedName

data class PrintBadgeRequest(
    @SerializedName("eventParticipantId") val eventParticipantId: String,
    @SerializedName("checkInId") val checkInId: String? = null,
)

data class PrintBadgeResponse(
    @SerializedName("jobId") val jobId: String,
    @SerializedName("token") val token: String,
    @SerializedName("html") val html: String,
    @SerializedName("paperWidth") val paperWidth: Double,
    @SerializedName("paperHeight") val paperHeight: Double,
    @SerializedName("printerDpi") val printerDpi: Int,
    @SerializedName("copies") val copies: Int,
)

data class PrintConfigResponse(
    @SerializedName("id") val id: String,
    @SerializedName("paperWidth") val paperWidth: Double,
    @SerializedName("paperHeight") val paperHeight: Double,
    @SerializedName("orientation") val orientation: String? = "PORTRAIT",
    @SerializedName("printerDpi") val printerDpi: Int,
    @SerializedName("copies") val copies: Int,
    @SerializedName("showQrCode") val showQrCode: Boolean? = true,
    @SerializedName("showAccessCode") val showAccessCode: Boolean? = false,
    @SerializedName("fontSizeName") val fontSizeName: Int? = 13,
    @SerializedName("fontSizeMeta") val fontSizeMeta: Int? = 9,
)

data class ApiErrorResponse(
    @SerializedName("error") val error: String,
    @SerializedName("code") val code: String? = null,
)
