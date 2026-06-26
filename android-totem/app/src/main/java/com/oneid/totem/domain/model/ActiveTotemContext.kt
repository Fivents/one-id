package com.oneid.totem.domain.model

data class ActiveTotemContext(
    val totemId: String,
    val totemName: String,
    val organizationId: String,
    val event: ActiveEvent,
    val totemOrganizationSubscriptionId: String,
    val totemEventSubscriptionId: String,
    val aiConfig: EventAIConfig,
)

data class ActiveEvent(
    val id: String,
    val name: String,
    val startsAt: String,
    val endsAt: String,
    val faceEnabled: Boolean,
    val qrEnabled: Boolean,
    val codeEnabled: Boolean,
    val allowSelfRegistration: Boolean,
    val hasPrintConfig: Boolean,
    val labelPrintPromptEnabled: Boolean,
    val labelPrintPromptTimeoutSeconds: Int,
)

data class EventAIConfig(
    val confidenceThreshold: Double,
    val detectionIntervalMs: Int,
    val maxFaces: Int,
    val livenessDetection: Boolean,
    val livenessThreshold: Double,
    val minFaceSize: Int,
    val cooldownSeconds: Int,
    val efSearch: Int,
    val topKCandidates: Int,
)
