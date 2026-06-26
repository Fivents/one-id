package com.oneid.totem.data.database.repo

import com.oneid.totem.data.database.DatabaseDataSource
import com.oneid.totem.data.local.TokenStorage
import com.oneid.totem.domain.model.CheckInResult as CheckInResultModel
import com.oneid.totem.domain.model.ParticipantInfo
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.CheckInResult
import javax.inject.Inject
import javax.inject.Singleton

private const val PERSON_COOLDOWN_MS = 5_000L
private const val FACE_EMBEDDING_DIMENSION = 512
private const val MIN_SEARCH_THRESHOLD = 0.5

@Singleton
class DatabaseCheckInRepository @Inject constructor(
    private val db: DatabaseDataSource,
    private val tokenStorage: TokenStorage,
) : CheckInRepository {

    private val totemEventSubscriptionId: String?
        get() = tokenStorage.getToken() // reused as totemEventSubscriptionId storage

    override suspend fun checkInByCode(accessCode: String): CheckInResult {
        return checkInByCredential("ACCESS_CODE", accessCode.uppercase())
    }

    override suspend fun checkInByQr(qrCodeValue: String): CheckInResult {
        return checkInByCredential("QR_CODE", qrCodeValue)
    }

    private suspend fun checkInByCredential(method: String, value: String): CheckInResult {
        return try {
            val totemId = tokenStorage.getTotemId() ?: return CheckInResult.Error("NO_SESSION", "No active session")
            val tesId = tokenStorage.getToken()
            if (tesId == null) return CheckInResult.Error("NO_SESSION", "No active session")

            val context = db.queryForOne("""
                SELECT e.id AS event_id, e.name AS event_name,
                       e.qr_enabled, e.code_enabled, e.face_enabled
                FROM totem t
                INNER JOIN totem_organization_subscriptions tos ON tos.totem_id = t.id
                INNER JOIN totem_event_subscriptions tes ON tes.totem_organization_subscription_id = tos.id
                INNER JOIN events e ON e.id = tes.event_id
                WHERE t.id = ? AND tes.id = ? AND e.deleted_at IS NULL
                LIMIT 1
            """.trimIndent(), totemId, tesId) ?: return CheckInResult.Error("NO_EVENT", "Event not found")

            val eventId = context["event_id"] as String
            val qrEnabled = context["qr_enabled"] as Boolean
            val codeEnabled = context["code_enabled"] as Boolean

            if (method == "QR_CODE" && !qrEnabled) {
                return CheckInResult.Error("METHOD_DISABLED", "QR check-in disabled")
            }
            if (method == "ACCESS_CODE" && !codeEnabled) {
                return CheckInResult.Error("METHOD_DISABLED", "Code check-in disabled")
            }

            val valueCol = if (method == "QR_CODE") "qr_code_value" else "access_code"

            val participant = db.queryForOne("""
                SELECT ep.id, ep.person_id, ep.company, ep.job_title,
                       ep.access_code, ep.qr_code_value,
                       p.name AS person_name
                FROM event_participants ep
                INNER JOIN people p ON p.id = ep.person_id
                WHERE ep.event_id = ? AND ep.$valueCol = ?
                  AND ep.deleted_at IS NULL AND p.deleted_at IS NULL
                LIMIT 1
            """.trimIndent(), eventId, value) ?: return CheckInResult.Error("PARTICIPANT_NOT_FOUND", "Participant not found")

            val epId = participant["id"] as String

            val dup = db.queryForOne(
                "SELECT id FROM check_ins WHERE event_participant_id = ? LIMIT 1",
                epId
            )
            if (dup != null) return CheckInResult.Error("DUPLICATE", "Already checked in")

            val ci = db.executeReturning("""
                INSERT INTO check_ins (method, checked_in_at, event_participant_id, totem_event_subscription_id)
                VALUES (?, NOW(), ?, ?)
                RETURNING id, checked_in_at
            """.trimIndent(), method, epId, tesId) ?: return CheckInResult.Error("CREATE_FAILED", "Failed to create check-in")

            CheckInResult.Success(CheckInResultModel(
                checkInId = ci["id"] as String,
                eventParticipantId = epId,
                participant = ParticipantInfo(
                    name = participant["person_name"] as String,
                    company = participant["company"] as? String,
                    jobTitle = participant["job_title"] as? String,
                    imageUrl = null,
                    accessCode = participant["access_code"] as? String,
                    qrCodeValue = participant["qr_code_value"] as? String,
                ),
            ))
        } catch (e: Exception) {
            CheckInResult.Error("DB_ERROR", e.message ?: "Database error")
        }
    }

    override suspend fun checkInByFace(
        embedding: List<Double>,
        livenessScore: Double?,
        blinkDetected: Boolean?,
    ): CheckInResult {
        return try {
            if (embedding.size != FACE_EMBEDDING_DIMENSION) {
                return CheckInResult.Error("INVALID_EMBEDDING", "Embedding must have $FACE_EMBEDDING_DIMENSION dimensions")
            }

            val totemId = tokenStorage.getTotemId() ?: return CheckInResult.Error("NO_SESSION", "No active session")
            val tesId = tokenStorage.getToken()
            if (tesId == null) return CheckInResult.Error("NO_SESSION", "No active session")

            val context = db.queryForOne("""
                SELECT e.id AS event_id, e.name AS event_name,
                       tos.organization_id, eac.liveness_detection,
                       eac.liveness_threshold, eac.confidence_threshold,
                       eac.max_faces, eac.cooldown_seconds
                FROM totem t
                INNER JOIN totem_organization_subscriptions tos ON tos.totem_id = t.id
                INNER JOIN totem_event_subscriptions tes ON tes.totem_organization_subscription_id = tos.id
                INNER JOIN events e ON e.id = tes.event_id
                LEFT JOIN event_ai_configs eac ON eac.event_id = e.id
                WHERE t.id = ? AND tes.id = ? AND e.deleted_at IS NULL
                LIMIT 1
            """.trimIndent(), totemId, tesId) ?: return CheckInResult.Error("NO_EVENT", "Event not found")

            val eventId = context["event_id"] as String
            val organizationId = context["organization_id"] as String
            val livenessDetection = context["liveness_detection"] as? Boolean ?: true
            val livenessThreshold = (context["liveness_threshold"] as? Number)?.toDouble() ?: 0.7
            val confidenceThreshold = (context["confidence_threshold"] as? Number)?.toDouble() ?: 0.62

            if (livenessDetection && livenessScore != null && livenessScore < livenessThreshold) {
                return CheckInResult.Error("LOW_LIVENESS", "Liveness check failed")
            }

            val pgvector = embedding.joinToString(",") { it.toString() }

            val match = db.queryForOne("""
                WITH ranked AS (
                    SELECT pf.id AS face_id, ep.id AS event_participant_id,
                           p.name AS person_name, ep.company, ep.job_title,
                           pf.image_url,
                           ep.access_code, ep.qr_code_value,
                           (1 - (pf.embedding_vector <=> ?::vector)) AS confidence,
                           ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY (pf.embedding_vector <=> ?::vector) ASC) AS rn
                    FROM person_faces pf
                    INNER JOIN people p ON p.id = pf.person_id
                    INNER JOIN event_participants ep ON ep.person_id = p.id
                    WHERE ep.event_id = ?
                      AND p.organization_id = ?
                      AND pf.is_active = true
                      AND pf.deleted_at IS NULL
                      AND pf.face_quality_score IS NOT NULL AND pf.face_quality_score >= 0.52
                      AND p.deleted_at IS NULL AND ep.deleted_at IS NULL
                      AND pf.embedding_vector IS NOT NULL
                )
                SELECT event_participant_id, person_name, company, job_title,
                       image_url, access_code, qr_code_value, confidence
                FROM ranked
                WHERE rn = 1 AND confidence >= ?
                ORDER BY confidence DESC
                LIMIT 1
            """.trimIndent(), pgvector, pgvector, eventId, organizationId, MIN_SEARCH_THRESHOLD)

            if (match == null) {
                return CheckInResult.Error("PARTICIPANT_NOT_FOUND", "Face not recognized")
            }

            val confidence = (match["confidence"] as Number).toDouble()
            if (confidence < confidenceThreshold) {
                return CheckInResult.Error("LOW_CONFIDENCE",
                    "Confidence $confidence below threshold $confidenceThreshold")
            }

            val epId = match["event_participant_id"] as String

            val dup = db.queryForOne(
                "SELECT id FROM check_ins WHERE event_participant_id = ? LIMIT 1",
                epId
            )
            if (dup != null) return CheckInResult.Error("DUPLICATE", "Already checked in")

            val cooldownSeconds = (context["cooldown_seconds"] as? Number)?.toInt() ?: 8
            val recent = db.queryForOne("""
                SELECT id FROM check_ins
                WHERE event_participant_id = ?
                  AND checked_in_at > NOW() - (? || ' seconds')::interval
                LIMIT 1
            """.trimIndent(), epId, cooldownSeconds.toString())
            if (recent != null) return CheckInResult.Error("COOLDOWN", "Cooldown active")

            val ci = db.executeReturning("""
                INSERT INTO check_ins (method, confidence, checked_in_at, event_participant_id, totem_event_subscription_id)
                VALUES ('FACE_RECOGNITION', ?, NOW(), ?, ?)
                RETURNING id, checked_in_at
            """.trimIndent(), confidence, epId, tesId) ?: return CheckInResult.Error("CREATE_FAILED", "Failed to create check-in")

            CheckInResult.Success(CheckInResultModel(
                checkInId = ci["id"] as String,
                eventParticipantId = epId,
                participant = ParticipantInfo(
                    name = match["person_name"] as String,
                    company = match["company"] as? String,
                    jobTitle = match["job_title"] as? String,
                    imageUrl = match["image_url"] as? String,
                    accessCode = match["access_code"] as? String,
                    qrCodeValue = match["qr_code_value"] as? String,
                ),
            ))
        } catch (e: Exception) {
            CheckInResult.Error("DB_ERROR", e.message ?: "Database error")
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
            val totemId = tokenStorage.getTotemId() ?: return CheckInResult.Error("NO_SESSION", "No active session")
            val tesId = tokenStorage.getToken()
            if (tesId == null) return CheckInResult.Error("NO_SESSION", "No active session")

            val ctx = db.queryForOne("""
                SELECT e.id AS event_id, tos.organization_id, e.allow_self_registration
                FROM totem t
                INNER JOIN totem_organization_subscriptions tos ON tos.totem_id = t.id
                INNER JOIN totem_event_subscriptions tes ON tes.totem_organization_subscription_id = tos.id
                INNER JOIN events e ON e.id = tes.event_id
                WHERE t.id = ? AND tes.id = ?
                LIMIT 1
            """.trimIndent(), totemId, tesId) ?: return CheckInResult.Error("NO_EVENT", "Event not found")

            if (ctx["allow_self_registration"] != true) {
                return CheckInResult.Error("SELF_REG_DISABLED", "Self-registration disabled")
            }

            val eventId = ctx["event_id"] as String
            val orgId = ctx["organization_id"] as String

            val person = db.executeReturning("""
                INSERT INTO people (name, email, organization_id, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
                RETURNING id
            """.trimIndent(), name, email, orgId) ?: return CheckInResult.Error("CREATE_FAILED", "Failed to create person")

            val personId = person["id"] as String

            val code = generateAccessCode()
            val participant = db.executeReturning("""
                INSERT INTO event_participants (event_id, person_id, company, job_title, access_code, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                RETURNING id
            """.trimIndent(), eventId, personId, company, jobTitle, code)

            if (participant == null) return CheckInResult.Error("CREATE_FAILED", "Failed to register")

            val epId = participant["id"] as String

            val ci = db.executeReturning("""
                INSERT INTO check_ins (method, checked_in_at, event_participant_id, totem_event_subscription_id)
                VALUES ('SELF_REGISTRATION', NOW(), ?, ?)
                RETURNING id
            """.trimIndent(), epId, tesId)

            CheckInResult.Success(CheckInResultModel(
                checkInId = ci?.get("id") as? String ?: "",
                eventParticipantId = epId,
                participant = ParticipantInfo(
                    name = name,
                    company = company,
                    jobTitle = jobTitle,
                    imageUrl = null,
                    accessCode = code,
                    qrCodeValue = null,
                ),
            ))
        } catch (e: Exception) {
            CheckInResult.Error("DB_ERROR", e.message ?: "Database error")
        }
    }

    private fun generateAccessCode(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return (1..6).map { chars.random() }.joinToString("")
    }
}
