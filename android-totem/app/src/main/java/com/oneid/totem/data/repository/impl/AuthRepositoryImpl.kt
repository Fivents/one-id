package com.oneid.totem.data.repository.impl

import com.oneid.totem.data.api.TotemApi
import com.oneid.totem.data.api.dto.LoginRequest
import com.oneid.totem.data.local.TokenStorage
import com.oneid.totem.domain.model.EventConfig
import com.oneid.totem.domain.model.TotemSession
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val api: TotemApi,
    private val tokenStorage: TokenStorage,
) : AuthRepository {

    override suspend fun login(key: String): AuthResult {
        return try {
            val response = api.login(LoginRequest(key))
            if (response.isSuccessful) {
                val body = response.body() ?: return AuthResult.Error("UNKNOWN", "Empty response")
                tokenStorage.saveToken(body.token)
                tokenStorage.saveTotemInfo(body.totem.id, body.totem.name)
                AuthResult.Success(mapToSession(body))
            } else {
                val errorBody = response.errorBody()?.string() ?: "Login failed"
                AuthResult.Error("LOGIN_FAILED", errorBody)
            }
        } catch (e: Exception) {
            AuthResult.Error("NETWORK_ERROR", e.message ?: "Network error")
        }
    }

    override suspend fun validateSession(): AuthResult {
        val token = tokenStorage.getToken() ?: return AuthResult.Error("MISSING_TOKEN", "No token found")
        return try {
            val response = api.getSession()
            if (response.isSuccessful) {
                val body = response.body() ?: return AuthResult.Error("UNKNOWN", "Empty response")
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
                        ),
                        totemEventSubscriptionId = body.totemEventSubscriptionId,
                        aiConfig = mapAIConfig(body.aiConfig),
                    )
                )
            } else {
                tokenStorage.clearToken()
                AuthResult.Error("SESSION_EXPIRED", "Session expired")
            }
        } catch (e: Exception) {
            AuthResult.Error("NETWORK_ERROR", e.message ?: "Network error")
        }
    }

    override suspend fun logout() {
        tokenStorage.clearToken()
    }

    override fun isLoggedIn(): Boolean = tokenStorage.getToken() != null

    private fun mapToSession(login: com.oneid.totem.data.api.dto.LoginResponse) = TotemSession(
        sessionId = "",
        expiresAt = "",
        totemId = login.totem.id,
        totemName = login.totem.name,
        activeEvent = EventConfig(
            id = login.activeEvent.id,
            name = login.activeEvent.name,
            faceEnabled = login.activeEvent.faceEnabled,
            qrEnabled = login.activeEvent.qrEnabled,
            codeEnabled = login.activeEvent.codeEnabled,
            allowSelfRegistration = login.activeEvent.allowSelfRegistration,
            hasPrintConfig = login.activeEvent.hasPrintConfig,
        ),
        totemEventSubscriptionId = login.totemEventSubscriptionId,
        aiConfig = mapAIConfig(login.aiConfig),
    )

    private fun mapAIConfig(ai: com.oneid.totem.data.api.dto.AIConfig) = com.oneid.totem.domain.model.AIConfig(
        confidenceThreshold = ai.confidenceThreshold,
        maxFaces = ai.maxFaces,
        minFaceSize = ai.minFaceSize,
        livenessDetection = ai.livenessDetection,
        livenessThreshold = ai.livenessThreshold,
        cooldownSeconds = ai.cooldownSeconds,
    )
}
