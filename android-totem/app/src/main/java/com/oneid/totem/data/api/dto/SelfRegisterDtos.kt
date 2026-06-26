package com.oneid.totem.data.api.dto

import com.google.gson.annotations.SerializedName

data class SelfRegisterRequest(
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("company") val company: String? = null,
    @SerializedName("jobTitle") val jobTitle: String? = null,
    @SerializedName("document") val document: String? = null,
    @SerializedName("phone") val phone: String? = null,
)

data class SelfRegisterResponse(
    @SerializedName("id") val id: String,
    @SerializedName("eventParticipantId") val eventParticipantId: String,
    @SerializedName("participant") val participant: ParticipantDto,
)
