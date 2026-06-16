package com.oneid.totem.presentation.screens.feedback

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
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

    val pulseAnim = rememberInfiniteTransition(label = "pulse")
    val iconScale by pulseAnim.animateFloat(
        initialValue = 0.95f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "iconPulse",
    )

    HapticEffect(trigger = uiState.isSuccess, feedbackType = android.view.HapticFeedbackConstants.CONFIRM)

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
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(
                        if (uiState.isSuccess) Success.copy(alpha = 0.15f)
                        else Error.copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (uiState.isSuccess) Icons.Filled.CheckCircle else Icons.Filled.Close,
                    contentDescription = null,
                    modifier = Modifier
                        .size(64.dp)
                        .alpha(if (uiState.isPrinting) 0.4f else iconScale),
                    tint = if (uiState.isSuccess) Success else Error,
                )
            }

            Spacer(Modifier.height(32.dp))

            Text(
                text = if (uiState.isSuccess) "Check-in realizado!" else "Falha no check-in",
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                ),
                color = if (uiState.isSuccess) Success else Error,
            )

            Spacer(Modifier.height(20.dp))

            if (uiState.isSuccess) {
                Text(
                    "Bem-vindo(a)",
                    style = MaterialTheme.typography.titleMedium,
                    color = OnSurfaceVariant,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = uiState.participantName,
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.5.sp,
                    ),
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
                Spacer(Modifier.height(32.dp))
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.5f)),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        if (uiState.isPrinting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Primary,
                                strokeWidth = 2.dp,
                            )
                            Spacer(Modifier.width(12.dp))
                            Text("Imprimindo badge...", color = OnSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                        } else if (uiState.printSuccess == true) {
                            Icon(Icons.Filled.Print, "Impresso", tint = Success, modifier = Modifier.size(22.dp))
                            Spacer(Modifier.width(12.dp))
                            Text("Badge impresso com sucesso", color = Success, style = MaterialTheme.typography.bodyMedium)
                        } else if (uiState.printSuccess == false) {
                            Text("Falha na impressão: ${uiState.printError.orEmpty()}", color = Error, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }

            Spacer(Modifier.height(48.dp))

            Button(
                onClick = onDone,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (uiState.isSuccess) Primary else Error,
                ),
            ) {
                Text(
                    "Voltar ao início",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                    ),
                    color = OnPrimary,
                )
            }
        }
    }
}
