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
import com.oneid.totem.domain.model.SelfRegistration
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import com.oneid.totem.domain.repository.SelfRegisterResult
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
        phone: String?,
        company: String?,
        jobTitle: String?,
        autoCheckIn: Boolean,
    ): SelfRegisterResult {
        return try {
            val response = apiClient.api.selfRegister(
                SelfRegisterRequest(
                    name = name.trim(),
                    email = email.trim(),
                    company = company?.trim()?.ifBlank { null },
                    jobTitle = jobTitle?.trim()?.ifBlank { null },
                    document = document?.trim()?.ifBlank { null },
                    phone = phone?.trim()?.ifBlank { null },
                    autoCheckIn = autoCheckIn,
                )
            )

            if (!response.isSuccessful) {
                val (code, message) = parseApiError(response.errorBody()?.string())
                return SelfRegisterResult.Error(code, message)
            }

            val body = response.body()
                ?: return SelfRegisterResult.Error("EMPTY_RESPONSE", "Resposta vazia")

            SelfRegisterResult.Success(
                SelfRegistration(
                    checkInId = body.id?.ifBlank { null },
                    eventParticipantId = body.eventParticipantId,
                    checkedIn = body.checkedIn && !body.id.isNullOrBlank(),
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
            SelfRegisterResult.Error("CONNECTION_ERROR", "Sem conexão com o servidor")
        } catch (e: java.net.SocketTimeoutException) {
            SelfRegisterResult.Error("TIMEOUT", "Tempo limite excedido")
        } catch (e: Exception) {
            SelfRegisterResult.Error("NETWORK_ERROR", e.message ?: "Erro de rede")
        }
    }

    private fun parseCheckInError(errorBody: String?): CheckInResult {
        val (code, message) = parseApiError(errorBody)
        return CheckInResult.Error(code, message)
    }

    /**
     * Traduz o corpo de erro da API em (código, mensagem em português). Fica separado do
     * [parseCheckInError] porque o auto-cadastro devolve [SelfRegisterResult], não
     * [CheckInResult], mas os códigos de erro vêm do mesmo vocabulário da API.
     */
    private fun parseApiError(errorBody: String?): Pair<String, String> {
        val apiError = try {
            gson.fromJson(errorBody, CheckInErrorResponse::class.java)
        } catch (_: Exception) {
            null
        }
        val message = apiError?.error ?: "Erro desconhecido"
        val code = apiError?.code ?: "UNKNOWN"

        val resolvedMessage = when (code) {
            "CHECKIN_PARTICIPANT_NOT_FOUND" -> "Participante não encontrado"
            "CHECKIN_DUPLICATE" -> "Participante já realizou check-in"
            "CHECKIN_METHOD_DISABLED" -> message
            "LOW_CONFIDENCE" -> {
                val confidence = apiError?.confidence
                val threshold = apiError?.threshold
                if (confidence != null && threshold != null) {
                    "Confiança ${"%.0f".format(confidence * 100)}% abaixo do limite de ${"%.0f".format(threshold * 100)}%"
                } else {
                    message
                }
            }
            "LOW_LIVENESS" -> "Prova de vida falhou. Mantenha os olhos abertos."
            "PARTICIPANT_ALREADY_REGISTERED" -> "Este e-mail já está inscrito neste evento"
            "PARTICIPANT_DOCUMENT_TAKEN" -> "Este CPF já está cadastrado com outro e-mail"
            "PARTICIPANT_EMAIL_TAKEN" -> "Este e-mail já está cadastrado"
            "PARTICIPANT_DUPLICATE_DATA" -> "Já existe um cadastro com esses dados"
            "SELF_REGISTRATION_DISABLED" -> "Auto-cadastro não está habilitado neste evento"
            "COOLDOWN" -> "Aguarde alguns segundos antes de tentar novamente"
            "TOTEM_NO_ACTIVE_EVENT" -> "Totem sem evento ativo"
            else -> message
        }

        return code to resolvedMessage
    }
}
