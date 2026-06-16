package com.oneid.totem.data.db

import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

data class ResolvedActiveContext(
    val totemId: String,
    val totemName: String,
    val organizationId: String,
    val totemOrganizationSubscriptionId: String,
    val totemEventSubscriptionId: String,
    val eventId: String,
    val eventName: String,
    val faceEnabled: Boolean,
    val qrEnabled: Boolean,
    val codeEnabled: Boolean,
    val allowSelfRegistration: Boolean,
    val hasPrintConfig: Boolean,
    val hasPrintConfigId: Boolean,
    val printConfigId: String?,
    val labelPrintPromptEnabled: Boolean,
    val labelPrintPromptTimeoutSeconds: Int,
    val confidenceThreshold: Double,
    val maxFaces: Int,
    val minFaceSize: Int,
    val livenessDetection: Boolean,
    val livenessThreshold: Double,
    val cooldownSeconds: Int,
    val efSearch: Int,
    val topKCandidates: Int,
)

@Singleton
class ActiveEventResolver @Inject constructor(
    private val db: DatabaseManager,
) {

    suspend fun resolveByAccessCode(accessCode: String): ResolvedActiveContext? {
        val now = Instant.now()

        val totem = db.queryOne(
            """
            SELECT id, name FROM totems
            WHERE access_code = ? AND deleted_at IS NULL AND status != 'MAINTENANCE'
            """.trimIndent(),
            listOf(accessCode),
        ) { row ->
            row.uuid("id") to row.stringNotNull("name")
        } ?: return null

        val (totemId, totemName) = totem

        val orgSub = db.queryOne(
            """
            SELECT id, organization_id FROM totem_organization_subscriptions
            WHERE totem_id = ? AND revoked_at IS NULL
              AND starts_at <= ? AND ends_at > ?
            ORDER BY starts_at DESC LIMIT 1
            """.trimIndent(),
            listOf(totemId, now, now),
        ) { row ->
            row.uuid("id") to row.uuid("organization_id")
        } ?: return null

        val (orgSubId, orgId) = orgSub

        val eventSub = db.queryOne(
            """
            SELECT tes.id, tes.event_id, e.name, e.face_enabled, e.qr_enabled, e.code_enabled,
                   e.allow_self_registration, e.print_config_id,
                   e.label_print_prompt_enabled, e.label_print_prompt_timeout_seconds
            FROM totem_event_subscriptions tes
            JOIN events e ON e.id = tes.event_id
            WHERE tes.totem_organization_subscription_id = ?
              AND tes.revoked_at IS NULL AND tes.deleted_at IS NULL
              AND e.deleted_at IS NULL AND e.status = 'ACTIVE'
              AND tes.starts_at <= ? AND tes.ends_at > ?
              AND e.starts_at <= ? AND e.ends_at > ?
            ORDER BY tes.starts_at DESC LIMIT 1
            """.trimIndent(),
            listOf(orgSubId, now, now, now, now),
        ) { row ->
            ResolvedActiveContext(
                totemId = totemId,
                totemName = totemName,
                organizationId = orgId,
                totemOrganizationSubscriptionId = orgSubId,
                totemEventSubscriptionId = row.uuid("id"),
                eventId = row.uuid("event_id"),
                eventName = row.stringNotNull("name"),
                faceEnabled = row.boolean("face_enabled"),
                qrEnabled = row.boolean("qr_enabled"),
                codeEnabled = row.boolean("code_enabled"),
                allowSelfRegistration = row.boolean("allow_self_registration"),
                hasPrintConfig = row.string("print_config_id") != null,
                hasPrintConfigId = row.string("print_config_id") != null,
                printConfigId = row.string("print_config_id"),
                labelPrintPromptEnabled = row.boolean("label_print_prompt_enabled"),
                labelPrintPromptTimeoutSeconds = row.int("label_print_prompt_timeout_seconds"),
                confidenceThreshold = 0.62,
                maxFaces = 1,
                minFaceSize = 80,
                livenessDetection = true,
                livenessThreshold = 0.7,
                cooldownSeconds = 8,
                efSearch = 64,
                topKCandidates = 5,
            )
        } ?: return null

        val aiConfig = db.queryOne(
            """
            SELECT confidence_threshold, max_faces, min_face_size, liveness_detection,
                   liveness_threshold, cooldown_seconds, ef_search, top_k_candidates
            FROM event_ai_configs WHERE event_id = ?
            """.trimIndent(),
            listOf(eventSub.eventId),
        ) { row ->
            eventSub.copy(
                confidenceThreshold = row.double("confidence_threshold") ?: 0.62,
                maxFaces = row.int("max_faces"),
                minFaceSize = row.int("min_face_size"),
                livenessDetection = row.boolean("liveness_detection"),
                livenessThreshold = row.double("liveness_threshold") ?: 0.7,
                cooldownSeconds = row.int("cooldown_seconds"),
                efSearch = row.int("ef_search"),
                topKCandidates = row.int("top_k_candidates"),
            )
        }

        return aiConfig ?: eventSub
    }

    suspend fun resolveByTotemId(totemId: String): ResolvedActiveContext? {
        val now = Instant.now()

        val totem = db.queryOne(
            "SELECT id, name FROM totems WHERE id = ? AND deleted_at IS NULL",
            listOf(totemId),
        ) { row ->
            row.uuid("id") to row.stringNotNull("name")
        } ?: return null

        val (_, totemName) = totem

        return resolveFromTotemId(totemId, totemName, now)
    }

    private suspend fun resolveFromTotemId(totemId: String, totemName: String, now: Instant): ResolvedActiveContext? {
        val orgSub = db.queryOne(
            """
            SELECT id, organization_id FROM totem_organization_subscriptions
            WHERE totem_id = ? AND revoked_at IS NULL
              AND starts_at <= ? AND ends_at > ?
            ORDER BY starts_at DESC LIMIT 1
            """.trimIndent(),
            listOf(totemId, now, now),
        ) { row ->
            row.uuid("id") to row.uuid("organization_id")
        } ?: return null

        val (orgSubId, orgId) = orgSub

        val eventSub = db.queryOne(
            """
            SELECT tes.id, tes.event_id, e.name, e.face_enabled, e.qr_enabled, e.code_enabled,
                   e.allow_self_registration, e.print_config_id,
                   e.label_print_prompt_enabled, e.label_print_prompt_timeout_seconds
            FROM totem_event_subscriptions tes
            JOIN events e ON e.id = tes.event_id
            WHERE tes.totem_organization_subscription_id = ?
              AND tes.revoked_at IS NULL AND tes.deleted_at IS NULL
              AND e.deleted_at IS NULL AND e.status = 'ACTIVE'
              AND tes.starts_at <= ? AND tes.ends_at > ?
              AND e.starts_at <= ? AND e.ends_at > ?
            ORDER BY tes.starts_at DESC LIMIT 1
            """.trimIndent(),
            listOf(orgSubId, now, now, now, now),
        ) { row ->
            val printConfigId = row.string("print_config_id")
            ResolvedActiveContext(
                totemId = totemId,
                totemName = totemName,
                organizationId = orgId,
                totemOrganizationSubscriptionId = orgSubId,
                totemEventSubscriptionId = row.uuid("id"),
                eventId = row.uuid("event_id"),
                eventName = row.stringNotNull("name"),
                faceEnabled = row.boolean("face_enabled"),
                qrEnabled = row.boolean("qr_enabled"),
                codeEnabled = row.boolean("code_enabled"),
                allowSelfRegistration = row.boolean("allow_self_registration"),
                hasPrintConfig = printConfigId != null,
                hasPrintConfigId = printConfigId != null,
                printConfigId = printConfigId,
                labelPrintPromptEnabled = row.boolean("label_print_prompt_enabled"),
                labelPrintPromptTimeoutSeconds = row.int("label_print_prompt_timeout_seconds"),
                confidenceThreshold = 0.62,
                maxFaces = 1,
                minFaceSize = 80,
                livenessDetection = true,
                livenessThreshold = 0.7,
                cooldownSeconds = 8,
                efSearch = 64,
                topKCandidates = 5,
            )
        } ?: return null

        val aiConfig = db.queryOne(
            """
            SELECT confidence_threshold, max_faces, min_face_size, liveness_detection,
                   liveness_threshold, cooldown_seconds, ef_search, top_k_candidates
            FROM event_ai_configs WHERE event_id = ?
            """.trimIndent(),
            listOf(eventSub.eventId),
        ) { row ->
            eventSub.copy(
                confidenceThreshold = row.double("confidence_threshold") ?: 0.62,
                maxFaces = row.int("max_faces"),
                minFaceSize = row.int("min_face_size"),
                livenessDetection = row.boolean("liveness_detection"),
                livenessThreshold = row.double("liveness_threshold") ?: 0.7,
                cooldownSeconds = row.int("cooldown_seconds"),
                efSearch = row.int("ef_search"),
                topKCandidates = row.int("top_k_candidates"),
            )
        }

        return aiConfig ?: eventSub
    }
}
