package com.oneid.totem.data.api.dto

import com.google.gson.annotations.SerializedName

data class SelfRegisterRequest(
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("company") val company: String? = null,
    @SerializedName("jobTitle") val jobTitle: String? = null,
    @SerializedName("document") val document: String? = null,
    @SerializedName("phone") val phone: String? = null,
    /**
     * Quando true a API já cria o check-in junto do cadastro (uma interação só). Quando
     * false a pessoa só fica inscrita no evento e faz o check-in depois, com o código que
     * recebeu. Quem decide é a configuração do totem, não do evento.
     */
    @SerializedName("autoCheckIn") val autoCheckIn: Boolean = true,
)

data class SelfRegisterResponse(
    /** Null quando o cadastro foi feito sem check-in automático. */
    @SerializedName("id") val id: String? = null,
    @SerializedName("eventParticipantId") val eventParticipantId: String,
    @SerializedName("checkedIn") val checkedIn: Boolean = true,
    @SerializedName("participant") val participant: ParticipantDto,
)
