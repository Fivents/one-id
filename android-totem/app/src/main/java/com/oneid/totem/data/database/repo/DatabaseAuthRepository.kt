package com.oneid.totem.data.database.repo

import com.oneid.totem.data.database.ActiveContextRepository
import com.oneid.totem.data.database.DatabaseDataSource
import com.oneid.totem.data.local.TokenStorage
import com.oneid.totem.domain.model.EventConfig
import com.oneid.totem.domain.model.TotemSession
import com.oneid.totem.domain.model.AIConfig as DomainAIConfig
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DatabaseAuthRepository @Inject constructor(
    private val db: DatabaseDataSource,
    private val activeContextRepository: ActiveContextRepository,
    private val tokenStorage: TokenStorage,
) : AuthRepository {

    override suspend fun login(key: String): AuthResult {
        return try {
            val now = java.time.Instant.now().toString()

            val totemRow = db.queryForOne("""
                SELECT id, name, status FROM totem
                WHERE access_code = ? AND deleted_at IS NULL
                LIMIT 1
            """.trimIndent(), key.uppercase()) ?: return AuthResult.Error("TOTEM_NOT_FOUND", "Totem não encontrado")

            val status = totemRow["status"] as String
            if (status == "MAINTENANCE") {
                return AuthResult.Error("TOTEM_MAINTENANCE", "Totem em manutenção")
            }

            val context = activeContextRepository.resolveByKey(key)
                ?: return AuthResult.Error("NO_ACTIVE_EVENT", "Nenhum evento ativo para este totem")

            tokenStorage.saveTotemInfo(context.totemId, context.totemName)
            tokenStorage.saveToken(context.totemEventSubscriptionId)

            AuthResult.Success(
                TotemSession(
                    sessionId = "",
                    expiresAt = "",
                    totemId = context.totemId,
                    totemName = context.totemName,
                    activeEvent = EventConfig(
                        id = context.event.id,
                        name = context.event.name,
                        faceEnabled = context.event.faceEnabled,
                        qrEnabled = context.event.qrEnabled,
                        codeEnabled = context.event.codeEnabled,
                        allowSelfRegistration = context.event.allowSelfRegistration,
                        hasPrintConfig = context.event.hasPrintConfig,
                    ),
                    totemEventSubscriptionId = context.totemEventSubscriptionId,
                    aiConfig = DomainAIConfig(
                        confidenceThreshold = context.aiConfig.confidenceThreshold,
                        maxFaces = context.aiConfig.maxFaces,
                        minFaceSize = context.aiConfig.minFaceSize,
                        livenessDetection = context.aiConfig.livenessDetection,
                        livenessThreshold = context.aiConfig.livenessThreshold,
                        cooldownSeconds = context.aiConfig.cooldownSeconds,
                    ),
                )
            )
        } catch (e: Exception) {
            AuthResult.Error("DB_ERROR", e.message ?: "Database error")
        }
    }

    override suspend fun validateSession(): AuthResult {
        val totemId = tokenStorage.getTotemId() ?: return AuthResult.Error("MISSING_TOTEM", "No totem stored")
        return try {
            val context = activeContextRepository.resolveByTotemId(totemId)
            if (context == null) {
                tokenStorage.clearToken()
                return AuthResult.Error("SESSION_EXPIRED", "Evento expirado ou totem desativado")
            }
            AuthResult.Success(
                TotemSession(
                    sessionId = "",
                    expiresAt = "",
                    totemId = context.totemId,
                    totemName = context.totemName,
                    activeEvent = EventConfig(
                        id = context.event.id,
                        name = context.event.name,
                        faceEnabled = context.event.faceEnabled,
                        qrEnabled = context.event.qrEnabled,
                        codeEnabled = context.event.codeEnabled,
                        allowSelfRegistration = context.event.allowSelfRegistration,
                        hasPrintConfig = context.event.hasPrintConfig,
                    ),
                    totemEventSubscriptionId = context.totemEventSubscriptionId,
                    aiConfig = DomainAIConfig(
                        confidenceThreshold = context.aiConfig.confidenceThreshold,
                        maxFaces = context.aiConfig.maxFaces,
                        minFaceSize = context.aiConfig.minFaceSize,
                        livenessDetection = context.aiConfig.livenessDetection,
                        livenessThreshold = context.aiConfig.livenessThreshold,
                        cooldownSeconds = context.aiConfig.cooldownSeconds,
                    ),
                )
            )
        } catch (e: Exception) {
            AuthResult.Error("DB_ERROR", e.message ?: "Database error")
        }
    }

    override suspend fun logout() {
        tokenStorage.clearToken()
    }

    override fun isLoggedIn(): Boolean = tokenStorage.getTotemId() != null
}
