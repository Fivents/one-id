package com.oneid.totem.data.db

import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class SelfRegisterResultData(
    val checkInId: String,
    val eventParticipantId: String,
    val participant: ParticipantInfoData,
)

@Singleton
class SelfRegisterDao @Inject constructor(
    private val db: DatabaseManager,
) {

    suspend fun selfRegister(
        organizationId: String,
        eventId: String,
        name: String,
        email: String,
        company: String?,
        totemEventSubscriptionId: String,
    ): SelfRegisterResultData {
        val now = Instant.now()

        return db.transaction {
            val existingPerson = query(
                """
                SELECT id, name, email, access_code, qr_code_value
                FROM people
                WHERE email = ? AND organization_id = ? AND deleted_at IS NULL
                LIMIT 1
                """.trimIndent(),
                listOf(email, organizationId),
            ) { row ->
                PersonRow(
                    id = row.uuid("id"),
                    name = row.stringNotNull("name"),
                    email = row.stringNotNull("email"),
                    accessCode = row.string("access_code"),
                    qrCodeValue = row.string("qr_code_value"),
                )
            }.firstOrNull()

            val personId: String
            val accessCode: String
            val qrCodeValue: String

            if (existingPerson != null) {
                personId = existingPerson.id
                accessCode = existingPerson.accessCode ?: generateCode(8)
                qrCodeValue = existingPerson.qrCodeValue ?: generateCode(10)
                if (existingPerson.accessCode == null || existingPerson.qrCodeValue == null) {
                    execute(
                        "UPDATE people SET access_code = COALESCE(access_code, ?), qr_code_value = COALESCE(qr_code_value, ?), updated_at = ? WHERE id = ?",
                        listOf(accessCode, qrCodeValue, now, personId),
                    )
                }
            } else {
                personId = UUID.randomUUID().toString()
                accessCode = generateCode(8)
                qrCodeValue = generateCode(10)
                execute(
                    """
                    INSERT INTO people (id, name, email, access_code, qr_code_value, organization_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """.trimIndent(),
                    listOf(personId, name, email, accessCode, qrCodeValue, organizationId, now, now),
                )
            }

            val existingEp = query(
                "SELECT id FROM event_participants WHERE person_id = ? AND event_id = ? AND deleted_at IS NULL LIMIT 1",
                listOf(personId, eventId),
            ) { it.uuid("id") }.firstOrNull()

            val epId: String
            if (existingEp != null) {
                epId = existingEp
            } else {
                epId = UUID.randomUUID().toString()
                execute(
                    """
                    INSERT INTO event_participants (id, person_id, event_id, company, access_code, qr_code_value, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """.trimIndent(),
                    listOf(epId, personId, eventId, company, accessCode, qrCodeValue, now, now),
                )
            }

            val checkInId = UUID.randomUUID().toString()
            execute(
                """
                INSERT INTO check_ins (id, method, checked_in_at, event_participant_id, totem_event_subscription_id)
                VALUES (?, CAST(? AS check_in_method), ?, ?, ?)
                """.trimIndent(),
                listOf(checkInId, "MANUAL", now, epId, totemEventSubscriptionId),
            )

            SelfRegisterResultData(
                checkInId = checkInId,
                eventParticipantId = epId,
                participant = ParticipantInfoData(
                    name = name,
                    company = company,
                    jobTitle = null,
                    imageUrl = null,
                    accessCode = accessCode,
                    qrCodeValue = qrCodeValue,
                ),
            )
        }
    }

    private fun generateCode(length: Int): String {
        val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return (1..length).map { chars.random() }.joinToString("")
    }

    private data class PersonRow(
        val id: String,
        val name: String,
        val email: String,
        val accessCode: String?,
        val qrCodeValue: String?,
    )
}
