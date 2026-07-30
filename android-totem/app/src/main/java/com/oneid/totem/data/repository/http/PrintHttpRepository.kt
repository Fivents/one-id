package com.oneid.totem.data.repository.http

import com.google.gson.Gson
import com.oneid.totem.data.api.ApiClient
import com.oneid.totem.data.api.dto.ApiErrorResponse
import com.oneid.totem.data.api.dto.PrintBadgeRequest
import com.oneid.totem.data.api.dto.PrintConfigResponse
import com.oneid.totem.domain.model.PrintData
import com.oneid.totem.domain.repository.PrintConfig
import com.oneid.totem.domain.repository.PrintRepository
import com.oneid.totem.domain.repository.PrintResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PrintHttpRepository @Inject constructor(
    private val apiClient: ApiClient,
) : PrintRepository {

    private val gson = Gson()

    override suspend fun printBadge(eventParticipantId: String, checkInId: String?): PrintResult {
        return try {
            val response = apiClient.api.printBadge(
                PrintBadgeRequest(
                    eventParticipantId = eventParticipantId,
                    checkInId = checkInId,
                )
            )

            if (!response.isSuccessful) {
                val errorBody = response.errorBody()?.string()
                val apiError = try {
                    gson.fromJson(errorBody, ApiErrorResponse::class.java)
                } catch (_: Exception) {
                    null
                }
                return PrintResult.Error(apiError?.error ?: "Erro ao solicitar impressão")
            }

            val body = response.body() ?: return PrintResult.Error("Resposta vazia do servidor")

            PrintResult.Success(
                PrintData(
                    jobId = body.jobId,
                    token = body.token,
                    html = body.html,
                    paperWidth = body.paperWidth,
                    paperHeight = body.paperHeight,
                    printerDpi = body.printerDpi,
                    copies = body.copies,
                    participantName = body.participantName ?: "",
                    company = body.company,
                    jobTitle = body.jobTitle,
                    qrCodeValue = body.qrCodeValue,
                    accessCode = body.accessCode,
                    eventName = body.eventName ?: "",
                    showQrCode = body.showQrCode ?: true,
                    showAccessCode = body.showAccessCode ?: false,
                )
            )
        } catch (e: java.net.ConnectException) {
            PrintResult.Error("Sem conexão com o servidor")
        } catch (e: java.net.SocketTimeoutException) {
            PrintResult.Error("Tempo limite excedido")
        } catch (e: Exception) {
            PrintResult.Error(e.message ?: "Erro de rede")
        }
    }

    override suspend fun getPrintConfig(): PrintConfig {
        return try {
            val response = apiClient.api.getPrintConfig()

            if (!response.isSuccessful) {
                return defaultConfig()
            }

            val body = response.body() ?: return defaultConfig()

            PrintConfig(
                paperWidth = body.paperWidth,
                paperHeight = body.paperHeight,
                printerDpi = body.printerDpi,
                copies = body.copies,
                showQrCode = body.showQrCode ?: true,
                showAccessCode = body.showAccessCode ?: false,
                fontSizeName = body.fontSizeName ?: 13,
                fontSizeMeta = body.fontSizeMeta ?: 9,
                orientation = body.orientation ?: "PORTRAIT",
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
        orientation = "PORTRAIT",
    )
}
