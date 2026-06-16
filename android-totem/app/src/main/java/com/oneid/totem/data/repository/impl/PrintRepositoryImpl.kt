package com.oneid.totem.data.repository.impl

import com.oneid.totem.data.api.TotemApi
import com.oneid.totem.data.api.dto.PrintRequest
import com.oneid.totem.domain.model.PrintData
import com.oneid.totem.domain.repository.PrintConfig
import com.oneid.totem.domain.repository.PrintRepository
import com.oneid.totem.domain.repository.PrintResult
import javax.inject.Inject

class PrintRepositoryImpl @Inject constructor(
    private val api: TotemApi,
) : PrintRepository {

    override suspend fun printBadge(eventParticipantId: String, checkInId: String?): PrintResult {
        return try {
            val response = api.printBadge(PrintRequest(eventParticipantId, checkInId))
            if (response.isSuccessful) {
                val body = response.body()!!
                PrintResult.Success(
                    PrintData(
                        jobId = body.jobId,
                        token = body.token,
                        html = body.html,
                        paperWidth = body.paperWidth,
                        paperHeight = body.paperHeight,
                        printerDpi = body.printerDpi,
                        copies = body.copies,
                    )
                )
            } else {
                PrintResult.Error("Print request failed: ${response.code()}")
            }
        } catch (e: Exception) {
            PrintResult.Error(e.message ?: "Print error")
        }
    }

    override suspend fun getPrintConfig(): PrintConfig {
        return try {
            val response = api.getPrintConfig()
            if (response.isSuccessful) {
                val body = response.body()!!
                PrintConfig(
                    paperWidth = body.paperWidth,
                    paperHeight = body.paperHeight,
                    printerDpi = body.printerDpi,
                    copies = body.copies,
                    showQrCode = body.showQrCode,
                    showAccessCode = body.showAccessCode,
                    fontSizeName = body.fontSizeName,
                    fontSizeMeta = body.fontSizeMeta,
                )
            } else {
                PrintConfig(90.0, 62.0, 300, 1, true, false, 13, 9)
            }
        } catch (_: Exception) {
            PrintConfig(90.0, 62.0, 300, 1, true, false, 13, 9)
        }
    }
}
