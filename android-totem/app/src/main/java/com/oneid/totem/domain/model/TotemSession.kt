package com.oneid.totem.domain.model

data class TotemSession(
    val sessionId: String,
    val expiresAt: String,
    val totemId: String,
    val totemName: String,
    val activeEvent: EventConfig,
    val totemEventSubscriptionId: String,
    val aiConfig: AIConfig,
)

data class EventConfig(
    val id: String,
    val name: String,
    val faceEnabled: Boolean,
    val qrEnabled: Boolean,
    val codeEnabled: Boolean,
    val allowSelfRegistration: Boolean,
    val hasPrintConfig: Boolean,
)

data class AIConfig(
    val confidenceThreshold: Double,
    val maxFaces: Int,
    val minFaceSize: Int,
    val livenessDetection: Boolean,
    val livenessThreshold: Double,
    val cooldownSeconds: Int,
)

data class CheckInResult(
    val checkInId: String,
    val eventParticipantId: String,
    val participant: ParticipantInfo,
)

data class ParticipantInfo(
    val name: String,
    val company: String?,
    val jobTitle: String?,
    val imageUrl: String?,
    val accessCode: String?,
    val qrCodeValue: String?,
)

data class PrintData(
    val jobId: String,
    val token: String,
    val html: String,
    val paperWidth: Double,
    val paperHeight: Double,
    val printerDpi: Int,
    val copies: Int,
)
