package com.oneid.totem.data.repository.http

import com.google.gson.Gson
import com.oneid.totem.data.api.ApiClient
import com.oneid.totem.data.api.dto.CheckInErrorResponse
import com.oneid.totem.data.api.dto.CodeCheckInRequest
import com.oneid.totem.data.api.dto.FaceCheckInRequest
import com.oneid.totem.data.api.dto.QrCheckInRequest
import com.oneid.totem.data.api.dto.SelfRegisterRequest
import com.oneid.totem.domain.model.CheckInResult as CheckInResultModel
import com.oneid.totem.domain.model.ParticipantInfo
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CheckInHttpRepository @Inject constructor(
    private val apiClient: ApiClient,
) : CheckInRepository {

    private val gson = Gson()

    override suspend fun checkInByCode(accessCode: String): CheckInResult {
        return try {
            val response = apiClient.api.checkInByCode(
                CodeCheckInRequest(accessCode = accessCode.uppercase())
            )

            if (!response.isSuccessful) {
                return parseCheckInError(response.errorBody()?.string())
            }

            val body = response.body() ?: return CheckInResult.Error("EMPTY_RESPONSE", "Resposta vazia")

            CheckInResult.Success(
                CheckInResultModel(
                    checkInId = body.id,
                    eventParticipantId = body.eventParticipantId,
                    participant = ParticipantInfo(
                        name = body.participant.name,
                        company = body.participant.company,
                        jobTitle = body.participant.jobTitle,
                        imageUrl = body.participant.imageUrl,
                        accessCode = body.participant.accessCode,
                        qrCodeValue = body.participant.qrCodeValue,
                    ),
                )
            )
        } catch (e: java.net.ConnectException) {
            CheckInResult.Error("CONNECTION_ERROR", "Sem conexão com o servidor")
        } catch (e: java.net.SocketTimeoutException) {
            CheckInResult.Error("TIMEOUT", "Tempo limite excedido")
        } catch (e: Exception) {
            CheckInResult.Error("NETWORK_ERROR", e.message ?: "Erro de rede")
        }
    }

    override suspend fun checkInByQr(qrCodeValue: String): CheckInResult {
        return try {
            val response = apiClient.api.checkInByQr(
                QrCheckInRequest(qrCodeValue = qrCodeValue)
            )

            if (!response.isSuccessful) {
                return parseCheckInError(response.errorBody()?.string())
            }

            val body = response.body() ?: return CheckInResult.Error("EMPTY_RESPONSE", "Resposta vazia")

            CheckInResult.Success(
                CheckInResultModel(
                    checkInId = body.id,
                    eventParticipantId = body.eventParticipantId,
                    participant = ParticipantInfo(
                        name = body.participant.name,
                        company = body.participant.company,
                        jobTitle = body.participant.jobTitle,
                        imageUrl = body.participant.imageUrl,
                        accessCode = body.participant.accessCode,
                        qrCodeValue = body.participant.qrCodeValue,
                    ),
                )
            )
        } catch (e: java.net.ConnectException) {
            CheckInResult.Error("CONNECTION_ERROR", "Sem conexão com o servidor")
        } catch (e: java.net.SocketTimeoutException) {
            CheckInResult.Error("TIMEOUT", "Tempo limite excedido")
        } catch (e: Exception) {
            CheckInResult.Error("NETWORK_ERROR", e.message ?: "Erro de rede")
        }
    }

    override suspend fun checkInByFace(
        embedding: List<Double>,
        livenessScore: Double?,
        blinkDetected: Boolean?,
    ): CheckInResult {
        return try {
            val response = apiClient.api.checkInByFace(
                FaceCheckInRequest(
                    embedding = embedding,
                    faceCount = 1,
                    livenessScore = livenessScore,
                    blinkDetected = blinkDetected,
                )
            )

            if (!response.isSuccessful) {
                return parseCheckInError(response.errorBody()?.string())
            }

            val body = response.body() ?: return CheckInResult.Error("EMPTY_RESPONSE", "Resposta vazia")

            CheckInResult.Success(
                CheckInResultModel(
                    checkInId = body.id,
                    eventParticipantId = body.eventParticipantId,
                    participant = ParticipantInfo(
                        name = body.participant.name,
                        company = body.participant.company,
                        jobTitle = body.participant.jobTitle,
                        imageUrl = body.participant.imageUrl,
                        accessCode = body.participant.accessCode,
                        qrCodeValue = body.participant.qrCodeValue,
                    ),
                )
            )
        } catch (e: java.net.ConnectException) {
            CheckInResult.Error("CONNECTION_ERROR", "Sem conexão com o servidor")
        } catch (e: java.net.SocketTimeoutException) {
            CheckInResult.Error("TIMEOUT", "Tempo limite excedido")
        } catch (e: Exception) {
            CheckInResult.Error("NETWORK_ERROR", e.message ?: "Erro de rede")
        }
    }

    override suspend fun selfRegister(
        name: String,
        email: String,
        document: String?,
        company: String?,
        jobTitle: String?,
    ): CheckInResult {
        return try {
            val response = apiClient.api.selfRegister(
                SelfRegisterRequest(
                    name = name.trim(),
                    email = email.trim(),
                    company = company?.trim()?.ifBlank { null },
                    jobTitle = jobTitle?.trim()?.ifBlank { null },
                )
            )

            if (!response.isSuccessful) {
                return parseCheckInError(response.errorBody()?.string())
            }

            val body = response.body() ?: return CheckInResult.Error("EMPTY_RESPONSE", "Resposta vazia")

            CheckInResult.Success(
                CheckInResultModel(
                    checkInId = body.id,
                    eventParticipantId = body.eventParticipantId,
                    participant = ParticipantInfo(
                        name = body.participant.name,
                        company = body.participant.company,
                        jobTitle = body.participant.jobTitle,
                        imageUrl = body.participant.imageUrl,
                        accessCode = body.participant.accessCode,
                        qrCodeValue = body.participant.qrCodeValue,
                    ),
                )
            )
        } catch (e: java.net.ConnectException) {
            CheckInResult.Error("CONNECTION_ERROR", "Sem conexão com o servidor")
        } catch (e: java.net.SocketTimeoutException) {
            CheckInResult.Error("TIMEOUT", "Tempo limite excedido")
        } catch (e: Exception) {
            CheckInResult.Error("NETWORK_ERROR", e.message ?: "Erro de rede")
        }
    }

    private fun parseCheckInError(errorBody: String?): CheckInResult {
        val apiError = try {
            gson.fromJson(errorBody, CheckInErrorResponse::class.java)
        } catch (_: Exception) {
            null
        }
        val message = apiError?.error ?: "Erro desconhecido"
        val code = apiError?.code ?: "UNKNOWN"

        return when (code) {
            "CHECKIN_PARTICIPANT_NOT_FOUND" -> CheckInResult.Error(code, "Participante não encontrado")
            "CHECKIN_DUPLICATE" -> CheckInResult.Error(code, "Participante já realizou check-in")
            "CHECKIN_METHOD_DISABLED" -> CheckInResult.Error(code, message)
            "LOW_CONFIDENCE" -> {
                val confidence = apiError?.confidence
                val threshold = apiError?.threshold
                val msg = if (confidence != null && threshold != null) {
                    "Confiança ${"%.0f".format(confidence * 100)}% abaixo do limite de ${"%.0f".format(threshold * 100)}%"
                } else {
                    message
                }
                CheckInResult.Error(code, msg)
            }
            "LOW_LIVENESS" -> CheckInResult.Error(code, "Prova de vida falhou. Mantenha os olhos abertos.")
            "PARTICIPANT_ALREADY_REGISTERED" -> CheckInResult.Error(code, "Participante já registrado neste evento")
            "SELF_REGISTRATION_DISABLED" -> CheckInResult.Error(code, "Auto-cadastro não está habilitado")
            "COOLDOWN" -> CheckInResult.Error(code, "Aguarde alguns segundos antes de tentar novamente")
            "TOTEM_NO_ACTIVE_EVENT" -> CheckInResult.Error(code, "Totem sem evento ativo")
            else -> CheckInResult.Error(code, message)
        }
    }
}
