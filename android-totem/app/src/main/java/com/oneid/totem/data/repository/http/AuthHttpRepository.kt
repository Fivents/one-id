package com.oneid.totem.data.repository.http

import com.google.gson.Gson
import com.oneid.totem.data.api.ApiClient
import com.oneid.totem.data.api.dto.ApiErrorResponse
import com.oneid.totem.data.api.dto.LoginRequest
import com.oneid.totem.data.local.TokenStorage
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.domain.model.AIConfig
import com.oneid.totem.domain.model.EventConfig
import com.oneid.totem.domain.model.TotemSession
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthHttpRepository @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val totemPreferences: TotemPreferences,
) : AuthRepository {

    private val gson = Gson()

    override suspend fun login(key: String): AuthResult {
        return try {
            val response = apiClient.api.login(LoginRequest(key = key.uppercase()))

            if (!response.isSuccessful) {
                val errorBody = response.errorBody()?.string()
                val apiError = try {
                    gson.fromJson(errorBody, ApiErrorResponse::class.java)
                } catch (_: Exception) {
                    null
                }
                val message = apiError?.error ?: "Erro de autenticação"
                val code = apiError?.code ?: "LOGIN_FAILED"
                return AuthResult.Error(code, message)
            }

            val body = response.body() ?: return AuthResult.Error("EMPTY_RESPONSE", "Resposta vazia do servidor")

            tokenStorage.saveTotemInfo(body.totem.id, body.totem.name)
            tokenStorage.saveToken(body.token)
            totemPreferences.totemAccessCode = key.uppercase()

            AuthResult.Success(
                TotemSession(
                    sessionId = "",
                    expiresAt = "",
                    totemId = body.totem.id,
                    totemName = body.totem.name,
                    activeEvent = EventConfig(
                        id = body.activeEvent.id,
                        name = body.activeEvent.name,
                        faceEnabled = body.activeEvent.faceEnabled,
                        qrEnabled = body.activeEvent.qrEnabled,
                        codeEnabled = body.activeEvent.codeEnabled,
                        allowSelfRegistration = body.activeEvent.allowSelfRegistration,
                        hasPrintConfig = body.activeEvent.hasPrintConfig,
                        labelPrintPromptEnabled = body.activeEvent.labelPrintPromptEnabled ?: false,
                        labelPrintPromptTimeoutSeconds = body.activeEvent.labelPrintPromptTimeoutSeconds ?: 15,
                    ),
                    totemEventSubscriptionId = body.totemEventSubscriptionId,
                    aiConfig = AIConfig(
                        confidenceThreshold = body.aiConfig.confidenceThreshold,
                        maxFaces = body.aiConfig.maxFaces ?: 1,
                        minFaceSize = body.aiConfig.minFaceSize ?: 56,
                        livenessDetection = body.aiConfig.livenessDetection ?: true,
                        livenessThreshold = body.aiConfig.livenessThreshold ?: 0.7,
                        cooldownSeconds = body.aiConfig.cooldownSeconds ?: 8,
                        efSearch = body.aiConfig.efSearch ?: 64,
                        topKCandidates = body.aiConfig.topKCandidates ?: 5,
                    ),
                )
            )
        } catch (e: java.net.ConnectException) {
            AuthResult.Error("CONNECTION_ERROR", "Não foi possível conectar ao servidor. Verifique sua conexão.")
        } catch (e: java.net.SocketTimeoutException) {
            AuthResult.Error("TIMEOUT", "Tempo limite excedido. Verifique sua conexão.")
        } catch (e: Exception) {
            AuthResult.Error("NETWORK_ERROR", e.message ?: "Erro de rede")
        }
    }

    override suspend fun validateSession(): AuthResult {
        val totemId = tokenStorage.getTotemId() ?: return AuthResult.Error("MISSING_TOTEM", "Nenhum totem armazenado")
        val token = tokenStorage.getToken() ?: return AuthResult.Error("MISSING_TOKEN", "Nenhum token armazenado")

        return try {
            val response = apiClient.api.validateSession()

            if (!response.isSuccessful) {
                tokenStorage.clearToken()
                return AuthResult.Error("SESSION_EXPIRED", "Sessão expirada. Faça login novamente.")
            }

            val body = response.body() ?: run {
                tokenStorage.clearToken()
                return AuthResult.Error("SESSION_EXPIRED", "Sessão expirada")
            }

            AuthResult.Success(
                TotemSession(
                    sessionId = body.sessionId,
                    expiresAt = body.expiresAt,
                    totemId = body.totem.id,
                    totemName = body.totem.name,
                    activeEvent = EventConfig(
                        id = body.activeEvent.id,
                        name = body.activeEvent.name,
                        faceEnabled = body.activeEvent.faceEnabled,
                        qrEnabled = body.activeEvent.qrEnabled,
                        codeEnabled = body.activeEvent.codeEnabled,
                        allowSelfRegistration = body.activeEvent.allowSelfRegistration,
                        hasPrintConfig = body.activeEvent.hasPrintConfig,
                        labelPrintPromptEnabled = body.activeEvent.labelPrintPromptEnabled ?: false,
                        labelPrintPromptTimeoutSeconds = body.activeEvent.labelPrintPromptTimeoutSeconds ?: 15,
                    ),
                    totemEventSubscriptionId = body.totemEventSubscriptionId,
                    aiConfig = AIConfig(
                        confidenceThreshold = body.aiConfig.confidenceThreshold,
                        maxFaces = body.aiConfig.maxFaces ?: 1,
                        minFaceSize = body.aiConfig.minFaceSize ?: 56,
                        livenessDetection = body.aiConfig.livenessDetection ?: true,
                        livenessThreshold = body.aiConfig.livenessThreshold ?: 0.7,
                        cooldownSeconds = body.aiConfig.cooldownSeconds ?: 8,
                        efSearch = body.aiConfig.efSearch ?: 64,
                        topKCandidates = body.aiConfig.topKCandidates ?: 5,
                    ),
                )
            )
        } catch (e: Exception) {
            AuthResult.Error("NETWORK_ERROR", e.message ?: "Erro de rede")
        }
    }

    override suspend fun logout() {
        tokenStorage.clearToken()
    }

    override fun isLoggedIn(): Boolean = tokenStorage.getTotemId() != null && tokenStorage.getToken() != null
}
