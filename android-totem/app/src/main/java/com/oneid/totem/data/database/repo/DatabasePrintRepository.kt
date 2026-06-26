package com.oneid.totem.data.database.repo

import com.oneid.totem.data.database.DatabaseDataSource
import com.oneid.totem.data.local.TokenStorage
import com.oneid.totem.domain.model.PrintData
import com.oneid.totem.domain.repository.PrintConfig
import com.oneid.totem.domain.repository.PrintRepository
import com.oneid.totem.domain.repository.PrintResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DatabasePrintRepository @Inject constructor(
    private val db: DatabaseDataSource,
    private val tokenStorage: TokenStorage,
) : PrintRepository {

    override suspend fun printBadge(eventParticipantId: String, checkInId: String?): PrintResult {
        return try {
            val totemId = tokenStorage.getTotemId() ?: return PrintResult.Error("No active session")
            val tesId = tokenStorage.getToken()
            if (tesId == null) return PrintResult.Error("No active session")

            val participant = db.queryForOne("""
                SELECT ep.id, ep.event_id, ep.company, ep.job_title,
                       ep.access_code, ep.qr_code_value,
                       p.name AS person_name,
                       e.name AS event_name, e.print_config_id
                FROM event_participants ep
                INNER JOIN people p ON p.id = ep.person_id
                INNER JOIN events e ON e.id = ep.event_id
                INNER JOIN totem_event_subscriptions tes ON tes.event_id = e.id
                WHERE ep.id = ? AND tes.id = ? AND ep.deleted_at IS NULL
                LIMIT 1
            """.trimIndent(), eventParticipantId, tesId)
                ?: return PrintResult.Error("Participant not found")

            if (participant["print_config_id"] == null) {
                return PrintResult.Error("No print configuration")
            }

            val printConfig = db.queryForOne("""
                SELECT id, paper_width, paper_height, orientation, printer_dpi,
                       copies, show_qr_code, show_access_code,
                       font_size_name, font_size_meta
                FROM print_configs WHERE id = ?
                LIMIT 1
            """.trimIndent(), participant["print_config_id"] as String)
                ?: return PrintResult.Error("Print config not found")

            val config = PrintConfig(
                paperWidth = (printConfig["paper_width"] as Number).toDouble(),
                paperHeight = (printConfig["paper_height"] as Number).toDouble(),
                printerDpi = (printConfig["printer_dpi"] as Number).toInt(),
                copies = (printConfig["copies"] as Number).toInt(),
                showQrCode = printConfig["show_qr_code"] as? Boolean ?: true,
                showAccessCode = printConfig["show_access_code"] as? Boolean ?: false,
                fontSizeName = (printConfig["font_size_name"] as? Number)?.toInt() ?: 13,
                fontSizeMeta = (printConfig["font_size_meta"] as? Number)?.toInt() ?: 9,
            )

            val printerDpi = config.printerDpi
            val paperWidth = config.paperWidth
            val paperHeight = config.paperHeight

            val eventName = participant["event_name"] as String
            val personName = participant["person_name"] as String
            val company = participant["company"] as? String
            val jobTitle = participant["job_title"] as? String
            val accessCode = participant["access_code"] as? String
            val qrCodeValue = participant["qr_code_value"] as? String

            val html = buildBadgeHtml(
                eventName = eventName,
                personName = personName,
                company = company,
                jobTitle = jobTitle,
                qrContent = qrCodeValue ?: accessCode ?: "",
                showQr = config.showQrCode,
                showAccessCode = config.showAccessCode,
                accessCode = accessCode,
                fontSizeName = config.fontSizeName,
                fontSizeMeta = config.fontSizeMeta,
            )

            val eventId = participant["event_id"] as String

            val job = db.executeReturning("""
                INSERT INTO print_jobs (event_id, event_participant_id, check_in_id, totem_id,
                    print_config_id, copies, status, html_content, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?, NOW(), NOW())
                RETURNING id
            """.trimIndent(), eventId, eventParticipantId, checkInId, totemId,
                printConfig["id"] as String, config.copies, html)

            PrintResult.Success(PrintData(
                jobId = job?.get("id") as? String ?: "",
                token = "",
                html = html,
                paperWidth = paperWidth,
                paperHeight = paperHeight,
                printerDpi = printerDpi,
                copies = config.copies,
            ))
        } catch (e: Exception) {
            PrintResult.Error(e.message ?: "Print error")
        }
    }

    override suspend fun getPrintConfig(): PrintConfig {
        return try {
            val tesId = tokenStorage.getToken() ?: return defaultConfig()

            val config = db.queryForOne("""
                SELECT pc.paper_width, pc.paper_height, pc.orientation, pc.printer_dpi,
                       pc.copies, pc.show_qr_code, pc.show_access_code,
                       pc.font_size_name, pc.font_size_meta
                FROM totem t
                INNER JOIN totem_organization_subscriptions tos ON tos.totem_id = t.id
                INNER JOIN totem_event_subscriptions tes ON tes.totem_organization_subscription_id = tos.id
                INNER JOIN events e ON e.id = tes.event_id
                INNER JOIN print_configs pc ON pc.id = e.print_config_id
                WHERE tes.id = ?
                LIMIT 1
            """.trimIndent(), tesId)

            if (config == null) return defaultConfig()

            PrintConfig(
                paperWidth = (config["paper_width"] as Number).toDouble(),
                paperHeight = (config["paper_height"] as Number).toDouble(),
                printerDpi = (config["printer_dpi"] as Number).toInt(),
                copies = (config["copies"] as Number).toInt(),
                showQrCode = config["show_qr_code"] as? Boolean ?: true,
                showAccessCode = config["show_access_code"] as? Boolean ?: false,
                fontSizeName = (config["font_size_name"] as? Number)?.toInt() ?: 13,
                fontSizeMeta = (config["font_size_meta"] as? Number)?.toInt() ?: 9,
            )
        } catch (_: Exception) {
            defaultConfig()
        }
    }

    private fun defaultConfig() = PrintConfig(
        paperWidth = 90.0,
        paperHeight = 62.0,
        printerDpi = 300,
        copies = 1,
        showQrCode = true,
        showAccessCode = false,
        fontSizeName = 13,
        fontSizeMeta = 9,
    )

    private fun buildBadgeHtml(
        eventName: String,
        personName: String,
        company: String?,
        jobTitle: String?,
        qrContent: String,
        showQr: Boolean,
        showAccessCode: Boolean,
        accessCode: String?,
        fontSizeName: Int,
        fontSizeMeta: Int,
    ): String {
        return """
        <html><body style="font-family:Arial;margin:0;padding:0">
        <div style="text-align:center;padding:12px;">
            <div style="font-size:${fontSizeName}pt;font-weight:bold;margin-bottom:4px;">$personName</div>
            ${company?.let { "<div style=\"font-size:${fontSizeMeta}pt;color:#555;\">$it</div>" } ?: ""}
            ${jobTitle?.let { "<div style=\"font-size:${fontSizeMeta}pt;color:#777;\">$it</div>" } ?: ""}
            <div style="font-size:8pt;color:#999;margin-top:4px;">$eventName</div>
            ${if (showQrCodeContent(qrContent)) "<div style=\"margin:8px auto;\"><img src=\"https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${urlEncode(qrContent)}\" width=\"100\" height=\"100\"/></div>" else ""}
            ${if (showAccessCode && accessCode != null) "<div style=\"font-size:${fontSizeMeta}pt;font-weight:bold;margin-top:4px;\">$accessCode</div>" else ""}
        </div>
        </body></html>
        """.trimIndent()
    }

    private fun showQrCodeContent(qr: String) = qr.isNotBlank()
    private fun urlEncode(s: String) = java.net.URLEncoder.encode(s, "UTF-8")
}
