package com.oneid.totem.data.repository.impl

import com.oneid.totem.data.db.DatabaseManager
import com.oneid.totem.data.db.PrintDao
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.data.print.LocalBadgeHtmlRenderer
import com.oneid.totem.domain.model.PrintData
import com.oneid.totem.domain.repository.PrintConfig
import com.oneid.totem.domain.repository.PrintRepository
import com.oneid.totem.domain.repository.PrintResult
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PrintRepositoryImpl @Inject constructor(
    private val printDao: PrintDao,
    private val badgeRenderer: LocalBadgeHtmlRenderer,
    private val db: DatabaseManager,
    private val prefs: TotemPreferences,
) : PrintRepository {

    override suspend fun printBadge(eventParticipantId: String, checkInId: String?): PrintResult {
        return try {
            val eventId = prefs.activeEventId
            val totemId = prefs.totemId
            if (eventId.isBlank() || totemId.isBlank()) {
                return PrintResult.Error("Nenhum evento ativo")
            }

            val printConfigId = resolvePrintConfigId(eventId)
            if (printConfigId == null) {
                return PrintResult.Error("Nenhuma configuração de impressão para este evento")
            }

            val config = printDao.getPrintConfig(printConfigId)
            val participant = printDao.getParticipantPrintData(eventParticipantId)
            if (config == null || participant == null) {
                return PrintResult.Error("Dados de impressão não encontrados")
            }

            val html = badgeRenderer.render(
                participantName = participant.name,
                company = participant.company,
                jobTitle = participant.jobTitle,
                accessCode = participant.accessCode,
                qrCodeValue = participant.qrCodeValue,
                eventName = prefs.eventName,
                showQrCode = config.showQrCode,
                showAccessCode = config.showAccessCode,
                fontSizeName = config.fontSizeName,
                fontSizeMeta = config.fontSizeMeta,
                paperWidthMm = config.paperWidth,
            )

            val jobId = printDao.createPrintJob(
                eventId = eventId,
                eventParticipantId = eventParticipantId,
                checkInId = checkInId,
                totemId = totemId,
                printConfigId = printConfigId,
            )

            PrintResult.Success(
                PrintData(
                    jobId = jobId,
                    token = UUID.randomUUID().toString().take(8),
                    html = html,
                    paperWidth = config.paperWidth,
                    paperHeight = config.paperHeight,
                    printerDpi = config.printerDpi,
                    copies = config.copies,
                )
            )
        } catch (e: Exception) {
            PrintResult.Error(e.message ?: "Erro ao preparar impressão")
        }
    }

    override suspend fun getPrintConfig(): PrintConfig {
        return try {
            val eventId = prefs.activeEventId
            if (eventId.isBlank()) return defaultPrintConfig()

            val printConfigId = resolvePrintConfigId(eventId)
            if (printConfigId == null) return defaultPrintConfig()

            val config = printDao.getPrintConfig(printConfigId)
            if (config == null) return defaultPrintConfig()

            PrintConfig(
                paperWidth = config.paperWidth,
                paperHeight = config.paperHeight,
                printerDpi = config.printerDpi,
                copies = config.copies,
                showQrCode = config.showQrCode,
                showAccessCode = config.showAccessCode,
                fontSizeName = config.fontSizeName,
                fontSizeMeta = config.fontSizeMeta,
            )
        } catch (_: Exception) {
            defaultPrintConfig()
        }
    }

    private suspend fun resolvePrintConfigId(eventId: String): String? {
        return db.queryOne(
            "SELECT print_config_id FROM events WHERE id = ? AND deleted_at IS NULL",
            listOf(eventId),
        ) { it.string("print_config_id") }
    }

    private fun defaultPrintConfig() = PrintConfig(
        paperWidth = 90.0,
        paperHeight = 62.0,
        printerDpi = 300,
        copies = 1,
        showQrCode = true,
        showAccessCode = false,
        fontSizeName = 13,
        fontSizeMeta = 9,
    )
}
