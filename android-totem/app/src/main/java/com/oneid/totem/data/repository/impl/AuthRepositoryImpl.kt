package com.oneid.totem.data.repository.impl

import com.oneid.totem.data.db.ActiveEventResolver
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.domain.model.EventConfig
import com.oneid.totem.domain.model.AIConfig
import com.oneid.totem.domain.model.TotemSession
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val eventResolver: ActiveEventResolver,
    private val prefs: TotemPreferences,
) : AuthRepository {

    override suspend fun login(key: String): AuthResult {
        return try {
            val code = key.uppercase().trim()
            val context = eventResolver.resolveByAccessCode(code)
            if (context == null) {
                return AuthResult.Error("TOTEM_NO_ACTIVE_EVENT", "Totem não encontrado ou sem evento ativo")
            }

            prefs.saveTotemSession(
                totemId = context.totemId,
                totemName = context.totemName,
                eventId = context.eventId,
                eventName = context.eventName,
                totemEventSubscriptionId = context.totemEventSubscriptionId,
            )
            prefs.totemAccessCode = code

            AuthResult.Success(mapToSession(context))
        } catch (e: Exception) {
            val cause = e.cause
            val detail = if (cause != null) "${cause::class.java.simpleName}: ${cause.message}" else e.message ?: ""
            AuthResult.Error("DB_ERROR", "Erro ao conectar: $detail")
        }
    }

    override suspend fun validateSession(): AuthResult {
        if (!isLoggedIn()) return AuthResult.Error("NOT_LOGGED_IN", "Nenhum totem logado")

        return try {
            val context = eventResolver.resolveByTotemId(prefs.totemId)
            if (context == null) {
                prefs.clearSession()
                return AuthResult.Error("TOTEM_NO_ACTIVE_EVENT", "Sessão expirada - nenhum evento ativo")
            }

            prefs.saveTotemSession(
                totemId = context.totemId,
                totemName = context.totemName,
                eventId = context.eventId,
                eventName = context.eventName,
                totemEventSubscriptionId = context.totemEventSubscriptionId,
            )

            AuthResult.Success(mapToSession(context))
        } catch (e: Exception) {
            val cause = e.cause
            val detail = if (cause != null) "${cause::class.java.simpleName}: ${cause.message}" else e.message ?: ""
            AuthResult.Error("DB_ERROR", "Erro ao validar sessão: $detail")
        }
    }

    override suspend fun logout() {
        prefs.clearSession()
    }

    override fun isLoggedIn(): Boolean = prefs.isLoggedIn

    private fun mapToSession(context: com.oneid.totem.data.db.ResolvedActiveContext) = TotemSession(
        sessionId = "",
        expiresAt = "",
        totemId = context.totemId,
        totemName = context.totemName,
        activeEvent = EventConfig(
            id = context.eventId,
            name = context.eventName,
            faceEnabled = context.faceEnabled,
            qrEnabled = context.qrEnabled,
            codeEnabled = context.codeEnabled,
            allowSelfRegistration = context.allowSelfRegistration,
            hasPrintConfig = context.hasPrintConfig,
            labelPrintPromptEnabled = context.labelPrintPromptEnabled,
            labelPrintPromptTimeoutSeconds = context.labelPrintPromptTimeoutSeconds,
        ),
        totemEventSubscriptionId = context.totemEventSubscriptionId,
        aiConfig = AIConfig(
            confidenceThreshold = context.confidenceThreshold,
            maxFaces = context.maxFaces,
            minFaceSize = context.minFaceSize,
            livenessDetection = context.livenessDetection,
            livenessThreshold = context.livenessThreshold,
            cooldownSeconds = context.cooldownSeconds,
            efSearch = context.efSearch,
            topKCandidates = context.topKCandidates,
        ),
    )
}
