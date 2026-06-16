package com.oneid.totem.data.db

import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class PrintConfigData(
    val id: String,
    val paperWidth: Double,
    val paperHeight: Double,
    val orientation: String,
    val printerDpi: Int,
    val copies: Int,
    val qrCodeContent: String,
    val showQrCode: Boolean,
    val showAccessCode: Boolean,
    val fontSizeName: Int,
    val fontSizeMeta: Int,
)

data class ParticipantPrintData(
    val name: String,
    val company: String?,
    val jobTitle: String?,
    val accessCode: String?,
    val qrCodeValue: String?,
)

@Singleton
class PrintDao @Inject constructor(
    private val db: DatabaseManager,
) {

    suspend fun getPrintConfig(printConfigId: String): PrintConfigData? {
        return db.queryOne(
            """
            SELECT id, paper_width, paper_height, orientation, printer_dpi, copies,
                   qr_code_content, show_qr_code, show_access_code,
                   font_size_name, font_size_meta
            FROM print_configs WHERE id = ?
            """.trimIndent(),
            listOf(printConfigId),
        ) { row ->
            PrintConfigData(
                id = row.uuid("id"),
                paperWidth = row.double("paper_width") ?: 90.0,
                paperHeight = row.double("paper_height") ?: 62.0,
                orientation = row.stringNotNull("orientation"),
                printerDpi = row.int("printer_dpi"),
                copies = row.int("copies"),
                qrCodeContent = row.stringNotNull("qr_code_content"),
                showQrCode = row.boolean("show_qr_code"),
                showAccessCode = row.boolean("show_access_code"),
                fontSizeName = row.int("font_size_name"),
                fontSizeMeta = row.int("font_size_meta"),
            )
        }
    }

    suspend fun getParticipantPrintData(eventParticipantId: String): ParticipantPrintData? {
        return db.queryOne(
            """
            SELECT p.name, ep.company, ep.job_title, p.access_code, p.qr_code_value
            FROM event_participants ep
            JOIN people p ON p.id = ep.person_id
            WHERE ep.id = ? AND ep.deleted_at IS NULL AND p.deleted_at IS NULL
            LIMIT 1
            """.trimIndent(),
            listOf(eventParticipantId),
        ) { row ->
            ParticipantPrintData(
                name = row.stringNotNull("name"),
                company = row.string("company"),
                jobTitle = row.string("job_title"),
                accessCode = row.string("access_code"),
                qrCodeValue = row.string("qr_code_value"),
            )
        }
    }

    suspend fun createPrintJob(
        eventId: String,
        eventParticipantId: String,
        checkInId: String?,
        totemId: String,
        printConfigId: String,
    ): String {
        val id = UUID.randomUUID().toString()
        val now = Instant.now()
        db.execute(
            """
            INSERT INTO print_jobs (id, status, copies, event_id, event_participant_id, check_in_id, totem_id, print_config_id, created_at, updated_at)
            VALUES (?, CAST(? AS "PrintJobStatus"), 1, ?, ?, ?, ?, ?, ?, ?)
            """.trimIndent(),
            listOf(id, "PENDING", eventId, eventParticipantId, checkInId, totemId, printConfigId, now, now),
        )
        return id
    }

    suspend fun updatePrintJobStatus(jobId: String, status: String, errorMessage: String? = null, printedAt: Instant? = null) {
        if (printedAt != null) {
            db.execute(
                """
                UPDATE print_jobs SET status = CAST(? AS "PrintJobStatus"), error_message = ?, printed_at = ?, updated_at = ? WHERE id = ?
                """.trimIndent(),
                listOf(status, errorMessage, printedAt, Instant.now(), jobId),
            )
        } else {
            db.execute(
                """
                UPDATE print_jobs SET status = CAST(? AS "PrintJobStatus"), error_message = ?, updated_at = ? WHERE id = ?
                """.trimIndent(),
                listOf(status, errorMessage, Instant.now(), jobId),
            )
        }
    }
}
