package com.oneid.totem.data.api.dto

import com.google.gson.annotations.SerializedName

data class SessionResponse(
    @SerializedName("sessionId") val sessionId: String,
    @SerializedName("expiresAt") val expiresAt: String,
    @SerializedName("totem") val totem: TotemDto,
    @SerializedName("activeEvent") val activeEvent: ActiveEventDto,
    @SerializedName("totemEventSubscriptionId") val totemEventSubscriptionId: String,
    @SerializedName("aiConfig") val aiConfig: AIConfigDto,
)
