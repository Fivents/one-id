package com.oneid.totem.presentation.screens.feedback

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Print
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.presentation.theme.*
import com.oneid.totem.presentation.util.HapticEffect

@Composable
fun FeedbackScreen(
    type: String,
    name: String,
    eventParticipantId: String = "",
    checkInId: String = "",
    onDone: () -> Unit,
    viewModel: FeedbackViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(type, name, eventParticipantId, checkInId) {
        viewModel.initialize(type, name, eventParticipantId, checkInId)
    }

    LaunchedEffect(Unit) {
        if (type == "success" && eventParticipantId.isNotBlank()) {
            viewModel.startPrinting()
        }
    }

    val infiniteAlpha = rememberInfiniteTransition(label = "pulse")
    val iconAlpha by infiniteAlpha.animateFloat(
        initialValue = 0.6f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "iconPulse",
    )

    HapticEffect(trigger = uiState.isSuccess, feedbackType = android.view.HapticFeedbackConstants.CONFIRM)
    HapticEffect(trigger = !uiState.isSuccess && uiState.participantName.isNotBlank(), feedbackType = android.view.HapticFeedbackConstants.REJECT)

    val autoReturnDelay = if (uiState.isPrinting || type != "success") 8000L else 4000L

    LaunchedEffect(uiState.printSuccess) {
        kotlinx.coroutines.delay(autoReturnDelay)
        onDone()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(if (uiState.isSuccess) SuccessContainer else ErrorContainer),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp),
        ) {
            Icon(
                imageVector = if (uiState.isSuccess) Icons.Filled.CheckCircle else Icons.Filled.Error,
                contentDescription = null,
                modifier = Modifier
                    .size(96.dp)
                    .alpha(if (uiState.isPrinting) 0.4f else iconAlpha),
                tint = if (uiState.isSuccess) Success else Error,
            )

            Spacer(Modifier.height(24.dp))

            Text(
                text = if (uiState.isSuccess) "Check-in realizado!" else "Falha no check-in",
                style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.Bold),
                color = if (uiState.isSuccess) Success else Error,
            )

            Spacer(Modifier.height(16.dp))

            if (uiState.isSuccess) {
                Text("Bem-vindo(a)", style = MaterialTheme.typography.titleMedium, color = OnSurfaceVariant)
                Spacer(Modifier.height(8.dp))
                Text(
                    text = uiState.participantName,
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.SemiBold),
                    color = OnSurface,
                    textAlign = TextAlign.Center,
                )
            } else {
                Text(
                    text = uiState.participantName.ifBlank { "Tente novamente" },
                    style = MaterialTheme.typography.bodyLarge,
                    color = OnSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }

            if (uiState.isSuccess) {
                Spacer(Modifier.height(24.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    if (uiState.isPrinting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Primary,
                            strokeWidth = 2.dp,
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Imprimindo badge...", color = OnSurfaceVariant)
                    } else if (uiState.printSuccess == true) {
                        Icon(Icons.Filled.Print, "Impresso", tint = Success, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Badge impresso", color = Success)
                    } else if (uiState.printSuccess == false) {
                        Text("Falha na impressão: ${uiState.printError.orEmpty()}", color = Error)
                    }
                }
            }

            Spacer(Modifier.height(40.dp))

            Button(
                onClick = onDone,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (uiState.isSuccess) Primary else Error,
                ),
            ) {
                Text("Voltar ao início", style = MaterialTheme.typography.titleMedium, color = OnPrimary)
            }
        }
    }
}
