package com.oneid.totem.data.db

import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class ParticipantInfoData(
    val name: String,
    val company: String?,
    val jobTitle: String?,
    val imageUrl: String?,
    val accessCode: String?,
    val qrCodeValue: String?,
)

data class CheckInResultData(
    val checkInId: String,
    val eventParticipantId: String,
    val participant: ParticipantInfoData,
    val confidence: Double?,
)

@Singleton
class CheckInDao @Inject constructor(
    private val db: DatabaseManager,
) {

    suspend fun findParticipantByQrCode(eventId: String, qrCodeValue: String): ParticipantData? {
        return db.queryOne(
            """
            SELECT ep.id, ep.company, ep.job_title, p.name, p.email,
                   p.access_code, p.qr_code_value
            FROM event_participants ep
            JOIN people p ON p.id = ep.person_id
            WHERE ep.event_id = ? AND ep.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND (ep.qr_code_value = ? OR p.qr_code_value = ?)
            LIMIT 1
            """.trimIndent(),
            listOf(eventId, qrCodeValue, qrCodeValue),
        ) { row ->
            ParticipantData(
                eventParticipantId = row.uuid("id"),
                personName = row.stringNotNull("name"),
                email = row.stringNotNull("email"),
                company = row.string("company"),
                jobTitle = row.string("job_title"),
                imageUrl = null,
                accessCode = row.string("access_code"),
                qrCodeValue = row.string("qr_code_value"),
            )
        }
    }

    suspend fun findParticipantByAccessCode(eventId: String, accessCode: String): ParticipantData? {
        return db.queryOne(
            """
            SELECT ep.id, ep.company, ep.job_title, p.name, p.email,
                   p.access_code, p.qr_code_value
            FROM event_participants ep
            JOIN people p ON p.id = ep.person_id
            WHERE ep.event_id = ? AND ep.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND (ep.access_code = ? OR p.access_code = ?)
            LIMIT 1
            """.trimIndent(),
            listOf(eventId, accessCode, accessCode),
        ) { row ->
            ParticipantData(
                eventParticipantId = row.uuid("id"),
                personName = row.stringNotNull("name"),
                email = row.stringNotNull("email"),
                company = row.string("company"),
                jobTitle = row.string("job_title"),
                imageUrl = null,
                accessCode = row.string("access_code"),
                qrCodeValue = row.string("qr_code_value"),
            )
        }
    }

    suspend fun findExistingCheckIn(eventParticipantId: String): String? {
        return db.queryOne(
            "SELECT id FROM check_ins WHERE event_participant_id = ?",
            listOf(eventParticipantId),
        ) { it.uuid("id") }
    }

    suspend fun createCheckIn(
        eventParticipantId: String,
        method: String,
        confidence: Double?,
        totemEventSubscriptionId: String,
    ): String {
        val now = Instant.now()
        val id = UUID.randomUUID().toString()
        db.execute(
            """
            INSERT INTO check_ins (id, method, confidence, checked_in_at, event_participant_id, totem_event_subscription_id)
            VALUES (?, CAST(? AS "CheckInMethod"), ?, ?, ?, ?)
            """.trimIndent(),
            listOf(id, method, confidence, now, eventParticipantId, totemEventSubscriptionId),
        )
        return id
    }

    suspend fun createAuditLog(
        action: String,
        description: String?,
        organizationId: String?,
        eventId: String?,
    ) {
        db.execute(
            """
            INSERT INTO audit_logs (id, action, description, organization_id, event_id, created_at)
            VALUES (?, CAST(? AS "AuditAction"), ?, ?, ?, ?)
            """.trimIndent(),
            listOf(UUID.randomUUID().toString(), action, description, organizationId, eventId, Instant.now()),
        )
    }

    suspend fun getCooldown(eventParticipantId: String, eventId: String): CooldownData? {
        return db.queryOne(
            """
            SELECT id, failed_attempts, current_cooldown_ms, cooldown_ends_at
            FROM person_check_in_cooldowns
            WHERE event_participant_id = ? AND event_id = ?
            """.trimIndent(),
            listOf(eventParticipantId, eventId),
        ) { row ->
            CooldownData(
                id = row.uuid("id"),
                failedAttempts = row.int("failed_attempts"),
                currentCooldownMs = row.int("current_cooldown_ms"),
                cooldownEndsAt = row.timestamp("cooldown_ends_at"),
            )
        }
    }

    suspend fun upsertCooldown(
        eventParticipantId: String,
        eventId: String,
        failedAttempts: Int,
        currentCooldownMs: Int,
        cooldownEndsAt: Instant,
    ) {
        val now = Instant.now()
        db.execute(
            """
            INSERT INTO person_check_in_cooldowns
                (id, event_participant_id, event_id, failed_attempts, current_cooldown_ms, cooldown_ends_at, last_attempt_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (event_participant_id, event_id)
            DO UPDATE SET failed_attempts = ?, current_cooldown_ms = ?, cooldown_ends_at = ?, last_attempt_at = ?, updated_at = ?
            """.trimIndent(),
            listOf(
                UUID.randomUUID().toString(), eventParticipantId, eventId,
                failedAttempts, currentCooldownMs, cooldownEndsAt, now, now, now,
                failedAttempts, currentCooldownMs, cooldownEndsAt, now, now,
            ),
        )
    }

    suspend fun resetCooldown(eventParticipantId: String, eventId: String) {
        val now = Instant.now()
        db.execute(
            """
            INSERT INTO person_check_in_cooldowns
                (id, event_participant_id, event_id, failed_attempts, current_cooldown_ms, cooldown_ends_at, last_attempt_at, reset_at, created_at, updated_at)
            VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
            ON CONFLICT (event_participant_id, event_id)
            DO UPDATE SET failed_attempts = 0, current_cooldown_ms = 0, cooldown_ends_at = ?, reset_at = ?, updated_at = ?
            """.trimIndent(),
            listOf(
                UUID.randomUUID().toString(), eventParticipantId, eventId,
                now, now, now, now,
                now, now, now,
            ),
        )
    }

    suspend fun updateTotemEventSubscriptionStats(
        totemEventSubscriptionId: String,
        success: Boolean,
        latencyMs: Long,
        confidence: Double?,
    ) {
        db.execute(
            """
            UPDATE totem_event_subscriptions
            SET total_check_ins = total_check_ins + 1,
                success_check_ins = CASE WHEN ? THEN success_check_ins + 1 ELSE success_check_ins END,
                last_check_in_at = ?,
                avg_check_in_latency_ms = CASE
                    WHEN avg_check_in_latency_ms IS NULL THEN ?
                    ELSE (avg_check_in_latency_ms * (total_check_ins) + ?) / (total_check_ins + 1)
                END,
                avg_confidence = CASE
                    WHEN ? IS NOT NULL AND avg_confidence IS NULL THEN ?
                    WHEN ? IS NOT NULL THEN (avg_confidence * ? + ?) / (? + 1)
                    ELSE avg_confidence
                END,
                updated_at = ?
            WHERE id = ?
            """.trimIndent(),
            listOf(success, Instant.now(), latencyMs.toDouble(), latencyMs.toDouble(),
                confidence, confidence, confidence, confidence,
                if (confidence != null) 1 else 0, if (confidence != null) 1 else 0,
                Instant.now(), totemEventSubscriptionId),
        )
    }

    suspend fun lookupPersonImage(eventParticipantId: String): String? {
        return db.queryOne(
            """
            SELECT pf.image_url FROM person_faces pf
            JOIN event_participants ep ON ep.person_id = pf.person_id
            WHERE ep.id = ? AND pf.is_active = true AND pf.deleted_at IS NULL
            ORDER BY pf.created_at DESC LIMIT 1
            """.trimIndent(),
            listOf(eventParticipantId),
        ) { it.string("image_url") }
    }
}

data class ParticipantData(
    val eventParticipantId: String,
    val personName: String,
    val email: String,
    val company: String?,
    val jobTitle: String?,
    val imageUrl: String?,
    val accessCode: String?,
    val qrCodeValue: String?,
)

data class CooldownData(
    val id: String,
    val failedAttempts: Int,
    val currentCooldownMs: Int,
    val cooldownEndsAt: Instant?,
)
