package com.oneid.totem.data.db

import javax.inject.Inject
import javax.inject.Singleton

data class FaceCandidate(
    val personId: String,
    val personName: String,
    val email: String,
    val eventParticipantId: String,
    val distance: Double,
)

@Singleton
class FaceDao @Inject constructor(
    private val db: DatabaseManager,
) {

    suspend fun searchTopK(
        eventId: String,
        embedding: List<Double>,
        topK: Int = 5,
        threshold: Double = 0.5,
    ): List<FaceCandidate> {
        if (embedding.size != 512) return emptyList()

        val vectorStr = embedding.joinToString(",") { it.toString() }

        return db.query(
            """
            SELECT p.id as person_id, p.name, p.email,
                   ep.id as event_participant_id,
                   pf.embedding_vector <=> ?::vector AS distance
            FROM person_faces pf
            JOIN people p ON p.id = pf.person_id
            JOIN event_participants ep ON ep.person_id = p.id AND ep.event_id = ? AND ep.deleted_at IS NULL
            WHERE pf.is_active = true AND pf.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND pf.embedding_vector IS NOT NULL
            ORDER BY distance
            LIMIT ?
            """.trimIndent(),
            listOf(vectorStr, eventId, topK),
        ) { row ->
            val dist = row.double("distance") ?: 1.0
            FaceCandidate(
                personId = row.uuid("person_id"),
                personName = row.stringNotNull("name"),
                email = row.stringNotNull("email"),
                eventParticipantId = row.uuid("event_participant_id"),
                distance = dist,
            )
        }
    }
}
