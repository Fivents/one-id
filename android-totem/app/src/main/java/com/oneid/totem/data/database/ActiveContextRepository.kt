package com.oneid.totem.data.database

import com.oneid.totem.domain.model.ActiveEvent
import com.oneid.totem.domain.model.ActiveTotemContext
import com.oneid.totem.domain.model.EventAIConfig
import javax.inject.Inject
import javax.inject.Singleton

private val DEFAULT_AI_CONFIG = EventAIConfig(
    confidenceThreshold = 0.62,
    detectionIntervalMs = 500,
    maxFaces = 1,
    livenessDetection = true,
    livenessThreshold = 0.7,
    minFaceSize = 56,
    cooldownSeconds = 8,
    efSearch = 64,
    topKCandidates = 5,
)

@Singleton
class ActiveContextRepository @Inject constructor(
    private val db: DatabaseDataSource,
) {

    fun resolveByKey(accessCode: String): ActiveTotemContext? {
        return resolveFromWhere(accessCode = accessCode.uppercase())
    }

    fun resolveByTotemId(totemId: String): ActiveTotemContext? {
        return resolveFromWhere(totemId = totemId)
    }

    private fun resolveFromWhere(totemId: String? = null, accessCode: String? = null): ActiveTotemContext? {
        val totemWhere = when {
            totemId != null -> "t.id = ?"
            accessCode != null -> "t.access_code = ?"
            else -> return null
        }
        val keyParam = totemId ?: accessCode

        val now = java.time.Instant.now().toString()

        val sql = """
            SELECT
                t.id AS totem_id,
                t.name AS totem_name,
                tos.id AS org_sub_id,
                tos.organization_id,
                tes.id AS event_sub_id,
                e.id AS event_id,
                e.name AS event_name,
                e.starts_at,
                e.ends_at,
                e.face_enabled,
                e.qr_enabled,
                e.code_enabled,
                e.allow_self_registration,
                e.print_config_id,
                e.label_print_prompt_enabled,
                e.label_print_prompt_timeout_seconds,
                eac.confidence_threshold,
                eac.detection_interval_ms,
                eac.max_faces,
                eac.liveness_detection,
                eac.liveness_threshold,
                eac.min_face_size,
                eac.cooldown_seconds,
                eac.ef_search,
                eac.top_k_candidates
            FROM totem t
            INNER JOIN totem_organization_subscriptions tos
                ON tos.totem_id = t.id
                AND tos.starts_at <= NOW() AND tos.ends_at >= NOW()
                AND tos.revoked_at IS NULL
            INNER JOIN totem_event_subscriptions tes
                ON tes.totem_organization_subscription_id = tos.id
                AND tes.starts_at <= NOW() AND tes.ends_at >= NOW()
                AND tes.revoked_at IS NULL
            INNER JOIN events e
                ON e.id = tes.event_id
                AND e.status = 'ACTIVE'
                AND e.starts_at <= NOW() AND e.ends_at >= NOW()
                AND e.deleted_at IS NULL
            LEFT JOIN event_ai_configs eac ON eac.event_id = e.id
            WHERE $totemWhere
                AND t.deleted_at IS NULL
                AND t.status != 'MAINTENANCE'
            ORDER BY tos.starts_at ASC, tes.starts_at ASC
            LIMIT 1
        """.trimIndent()

        val row = db.queryForOne(sql, keyParam) ?: return null

        return ActiveTotemContext(
            totemId = row["totem_id"] as String,
            totemName = row["totem_name"] as String,
            organizationId = row["organization_id"] as String,
            totemOrganizationSubscriptionId = row["org_sub_id"] as String,
            totemEventSubscriptionId = row["event_sub_id"] as String,
            event = ActiveEvent(
                id = row["event_id"] as String,
                name = row["event_name"] as String,
                startsAt = (row["starts_at"] ?: "").toString(),
                endsAt = (row["ends_at"] ?: "").toString(),
                faceEnabled = row["face_enabled"] as Boolean,
                qrEnabled = row["qr_enabled"] as Boolean,
                codeEnabled = row["code_enabled"] as Boolean,
                allowSelfRegistration = row["allow_self_registration"] as Boolean,
                hasPrintConfig = row["print_config_id"] != null,
                labelPrintPromptEnabled = row["label_print_prompt_enabled"] as? Boolean ?: false,
                labelPrintPromptTimeoutSeconds = (row["label_print_prompt_timeout_seconds"] as? Number)?.toInt() ?: 15,
            ),
            aiConfig = mapAIConfig(row),
        )
    }

    private fun mapAIConfig(row: Map<String, Any?>): EventAIConfig {
        if (row["confidence_threshold"] == null) return DEFAULT_AI_CONFIG
        return EventAIConfig(
            confidenceThreshold = (row["confidence_threshold"] as Number).toDouble(),
            detectionIntervalMs = (row["detection_interval_ms"] as Number).toInt(),
            maxFaces = (row["max_faces"] as Number).toInt(),
            livenessDetection = row["liveness_detection"] as Boolean,
            livenessThreshold = (row["liveness_threshold"] as? Number)?.toDouble() ?: DEFAULT_AI_CONFIG.livenessThreshold,
            minFaceSize = (row["min_face_size"] as Number).toInt(),
            cooldownSeconds = (row["cooldown_seconds"] as? Number)?.toInt() ?: DEFAULT_AI_CONFIG.cooldownSeconds,
            efSearch = (row["ef_search"] as? Number)?.toInt() ?: DEFAULT_AI_CONFIG.efSearch,
            topKCandidates = (row["top_k_candidates"] as? Number)?.toInt() ?: DEFAULT_AI_CONFIG.topKCandidates,
        )
    }
}
