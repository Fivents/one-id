package com.oneid.totem.domain.repository

import com.oneid.totem.domain.model.PrintData

enum class LabelLayout { STANDARD, COMPACT, MINIMAL_QR }

sealed class PrintResult {
    data class Success(val data: PrintData) : PrintResult()
    data class Error(val message: String) : PrintResult()
}

interface PrintRepository {
    suspend fun printBadge(eventParticipantId: String, checkInId: String? = null): PrintResult
    suspend fun getPrintConfig(): PrintConfig
}

data class PrintConfig(
    val paperWidth: Double,
    val paperHeight: Double,
    val printerDpi: Int,
    val copies: Int,
    val showQrCode: Boolean,
    val showAccessCode: Boolean,
    val fontSizeName: Int,
    val fontSizeMeta: Int,
    val orientation: String = "PORTRAIT",
    val labelLayout: LabelLayout = LabelLayout.STANDARD,
)
