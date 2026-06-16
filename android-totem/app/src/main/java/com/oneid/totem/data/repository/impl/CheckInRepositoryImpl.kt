package com.oneid.totem.data.repository.impl

import com.oneid.totem.data.db.ActiveEventResolver
import com.oneid.totem.data.db.CheckInDao
import com.oneid.totem.data.db.DatabaseManager
import com.oneid.totem.data.db.FaceDao
import com.oneid.totem.data.db.SelfRegisterDao
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.domain.model.ParticipantInfo
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CheckInRepositoryImpl @Inject constructor(
    private val checkInDao: CheckInDao,
    private val faceDao: FaceDao,
    private val selfRegisterDao: SelfRegisterDao,
    private val eventResolver: ActiveEventResolver,
    private val db: DatabaseManager,
    private val prefs: TotemPreferences,
) : CheckInRepository {

    override suspend fun checkInByCode(accessCode: String): CheckInResult {
        return performCheckIn("ACCESS_CODE", accessCode = accessCode.uppercase())
    }

    override suspend fun checkInByQr(qrCodeValue: String): CheckInResult {
        return performCheckIn("QR_CODE", qrCodeValue = qrCodeValue)
    }

    override suspend fun checkInByFace(
        embedding: List<Double>,
        livenessScore: Double?,
        blinkDetected: Boolean?,
    ): CheckInResult {
        return try {
            val eventId = prefs.activeEventId
            val subId = prefs.totemEventSubscriptionId
            val orgId = getOrganizationId()
            if (eventId.isBlank()) return CheckInResult.Error("NO_EVENT", "Nenhum evento ativo")

            val topK = 5
            val threshold = 0.62

            val candidates = faceDao.searchTopK(eventId, embedding, topK)
            if (candidates.isEmpty()) {
                return CheckInResult.Error("PARTICIPANT_NOT_FOUND", "Rosto não reconhecido")
            }

            val best = candidates.first()
            if (best.distance > threshold) {
                return CheckInResult.Error("LOW_CONFIDENCE", "Confiança baixa (${"%.0f".format((1 - best.distance) * 100)}%)")
            }

            val duplicateId = checkInDao.findExistingCheckIn(best.eventParticipantId)
            if (duplicateId != null) {
                return CheckInResult.Error("DUPLICATE", "Check-in já realizado para este participante")
            }

            val cooldown = checkInDao.getCooldown(best.eventParticipantId, eventId)
            if (cooldown != null) {
                val cooldownEnd = cooldown.cooldownEndsAt
                if (cooldownEnd != null && Instant.now().isBefore(cooldownEnd)) {
                    return CheckInResult.Error("COOLDOWN", "Aguarde antes de tentar novamente")
                }
            }

            val checkInId = checkInDao.createCheckIn(
                eventParticipantId = best.eventParticipantId,
                method = "FACE_RECOGNITION",
                confidence = (1.0 - best.distance).coerceIn(0.0, 1.0),
                totemEventSubscriptionId = subId,
            )

            checkInDao.resetCooldown(best.eventParticipantId, eventId)

            checkInDao.createAuditLog(
                action = "CHECK_IN_APPROVED",
                description = "Check-in facial: ${best.personName} (confiança: ${"%.2f".format(1 - best.distance)})",
                organizationId = orgId,
                eventId = eventId,
            )

            val imageUrl = checkInDao.lookupPersonImage(best.eventParticipantId)

            CheckInResult.Success(
                com.oneid.totem.domain.model.CheckInResult(
                    checkInId = checkInId,
                    eventParticipantId = best.eventParticipantId,
                    participant = ParticipantInfo(
                        name = best.personName,
                        company = null,
                        jobTitle = null,
                        imageUrl = imageUrl,
                        accessCode = null,
                        qrCodeValue = null,
                    ),
                )
            )
        } catch (e: Exception) {
            CheckInResult.Error("DB_ERROR", e.message ?: "Erro no banco de dados")
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
            val eventId = prefs.activeEventId
            val subId = prefs.totemEventSubscriptionId
            if (eventId.isBlank() || subId.isBlank()) {
                return CheckInResult.Error("NO_EVENT", "Nenhum evento ativo")
            }

            val orgId = getOrganizationId()
            if (orgId == null) return CheckInResult.Error("NO_ORG", "Organização não encontrada")

            val result = selfRegisterDao.selfRegister(
                organizationId = orgId,
                eventId = eventId,
                name = name.trim(),
                email = email.trim(),
                company = company?.trim()?.ifBlank { null },
                totemEventSubscriptionId = subId,
            )

            checkInDao.createAuditLog(
                action = "CHECK_IN",
                description = "Auto-cadastro: $name",
                organizationId = orgId,
                eventId = eventId,
            )

            CheckInResult.Success(
                com.oneid.totem.domain.model.CheckInResult(
                    checkInId = result.checkInId,
                    eventParticipantId = result.eventParticipantId,
                    participant = ParticipantInfo(
                        name = result.participant.name,
                        company = result.participant.company,
                        jobTitle = result.participant.jobTitle,
                        imageUrl = result.participant.imageUrl,
                        accessCode = result.participant.accessCode,
                        qrCodeValue = result.participant.qrCodeValue,
                    ),
                )
            )
        } catch (e: Exception) {
            CheckInResult.Error("DB_ERROR", e.message ?: "Erro no auto-cadastro")
        }
    }

    private suspend fun performCheckIn(
        method: String,
        accessCode: String? = null,
        qrCodeValue: String? = null,
    ): CheckInResult {
        return try {
            val eventId = prefs.activeEventId
            val subId = prefs.totemEventSubscriptionId
            if (eventId.isBlank()) return CheckInResult.Error("NO_EVENT", "Nenhum evento ativo")

            val participant = when {
                qrCodeValue != null -> checkInDao.findParticipantByQrCode(eventId, qrCodeValue)
                accessCode != null -> checkInDao.findParticipantByAccessCode(eventId, accessCode)
                else -> null
            }

            if (participant == null) {
                val msg = if (method == "QR_CODE") "QR Code não reconhecido" else "Código de acesso inválido"
                val orgId = getOrganizationId()
                checkInDao.createAuditLog(
                    action = "CHECK_IN_DENIED",
                    description = "Tentativa de check-in por ${if (method == "QR_CODE") "QR Code" else "Código"} - não encontrado: ${accessCode ?: qrCodeValue}",
                    organizationId = orgId,
                    eventId = eventId,
                )
                return CheckInResult.Error("PARTICIPANT_NOT_FOUND", msg)
            }

            val duplicateId = checkInDao.findExistingCheckIn(participant.eventParticipantId)
            if (duplicateId != null) {
                return CheckInResult.Error("DUPLICATE", "Check-in já realizado para este participante")
            }

            val checkInId = checkInDao.createCheckIn(
                eventParticipantId = participant.eventParticipantId,
                method = method,
                confidence = null,
                totemEventSubscriptionId = subId,
            )

            val orgId = getOrganizationId()
            checkInDao.createAuditLog(
                action = "CHECK_IN_APPROVED",
                description = "Check-in por ${if (method == "QR_CODE") "QR Code" else "Código"}: ${participant.personName}",
                organizationId = orgId,
                eventId = eventId,
            )

            val imageUrl = checkInDao.lookupPersonImage(participant.eventParticipantId)

            CheckInResult.Success(
                com.oneid.totem.domain.model.CheckInResult(
                    checkInId = checkInId,
                    eventParticipantId = participant.eventParticipantId,
                    participant = ParticipantInfo(
                        name = participant.personName,
                        company = participant.company,
                        jobTitle = participant.jobTitle,
                        imageUrl = imageUrl,
                        accessCode = participant.accessCode,
                        qrCodeValue = participant.qrCodeValue,
                    ),
                )
            )
        } catch (e: Exception) {
            CheckInResult.Error("DB_ERROR", e.message ?: "Erro no banco de dados")
        }
    }

    private suspend fun getOrganizationId(): String? {
        return db.queryOne(
            """
            SELECT tos.organization_id
            FROM totem_organization_subscriptions tos
            WHERE tos.totem_id = ? AND tos.revoked_at IS NULL
            ORDER BY tos.starts_at DESC LIMIT 1
            """.trimIndent(),
            listOf(prefs.totemId),
        ) { it.string("organization_id") }
    }
}
