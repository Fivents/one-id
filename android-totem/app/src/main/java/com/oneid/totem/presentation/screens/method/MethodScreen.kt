package com.oneid.totem.presentation.screens.method

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.presentation.components.MethodCard
import com.oneid.totem.presentation.theme.*

@Composable
fun MethodScreen(
    onNavigateToFace: () -> Unit,
    onNavigateToQr: () -> Unit,
    onNavigateToCode: () -> Unit,
    onNavigateToSelfRegister: () -> Unit,
    onNavigateToPrinterSetup: () -> Unit,
    onLogout: () -> Unit,
    viewModel: MethodViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.hasLoggedOut) {
        if (uiState.hasLoggedOut) onLogout()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        if (uiState.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = Primary,
            )
        } else if (uiState.session == null) {
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("Sessão expirada", style = MaterialTheme.typography.headlineMedium, color = OnSurface)
                Spacer(Modifier.height(16.dp))
                Button(onClick = viewModel::refresh, colors = ButtonDefaults.buttonColors(containerColor = Primary)) {
                    Text("Tentar novamente")
                }
            }
        } else {
            val event = uiState.session!!.activeEvent

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    text = "ONE-ID",
                    style = MaterialTheme.typography.displayMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 28.sp,
                        letterSpacing = 4.sp,
                    ),
                    color = Primary,
                )

                Spacer(Modifier.height(4.dp))

                Text(text = event.name, style = MaterialTheme.typography.titleLarge, color = OnSurfaceVariant)

                Spacer(Modifier.height(40.dp))

                Text("Escolha o método de check-in", style = MaterialTheme.typography.titleMedium, color = OnSurfaceVariant)

                Spacer(Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    if (event.faceEnabled) {
                        MethodCard(
                            title = "Reconhecimento\nFacial",
                            description = if (listOf(event.faceEnabled, event.qrEnabled, event.codeEnabled).count { it } > 1) "Aproxime o rosto" else "",
                            icon = Icons.Filled.Face,
                            onClick = onNavigateToFace,
                            modifier = Modifier.weight(1f),
                            color = Primary,
                        )
                    }
                    if (event.qrEnabled) {
                        MethodCard(
                            title = "QR Code",
                            description = if (listOf(event.faceEnabled, event.qrEnabled, event.codeEnabled).count { it } > 1) "Leia o QR Code" else "",
                            icon = Icons.Filled.QrCodeScanner,
                            onClick = onNavigateToQr,
                            modifier = Modifier.weight(1f),
                            color = Secondary,
                        )
                    }
                    if (event.codeEnabled) {
                        MethodCard(
                            title = "Código de\nAcesso",
                            description = if (listOf(event.faceEnabled, event.qrEnabled, event.codeEnabled).count { it } > 1) "Digite o código" else "",
                            icon = Icons.Filled.Keyboard,
                            onClick = onNavigateToCode,
                            modifier = Modifier.weight(1f),
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }

                if (event.allowSelfRegistration) {
                    Spacer(Modifier.height(24.dp))
                    OutlinedButton(
                        onClick = onNavigateToSelfRegister,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary),
                    ) {
                        Icon(Icons.Filled.PersonAdd, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Sou novo aqui — Quero me cadastrar")
                    }
                }

                Spacer(Modifier.weight(1f))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    // Printer config
                    IconButton(onClick = onNavigateToPrinterSetup) {
                        Icon(
                            Icons.Filled.Print,
                            contentDescription = "Configurar impressora",
                            tint = if (uiState.printerIp.isNotBlank()) Primary else OnSurfaceVariant.copy(alpha = 0.5f),
                        )
                    }

                    TextButton(onClick = viewModel::logout) {
                        Text("Sair", color = OnSurfaceVariant)
                    }
                }
            }
        }
    }

}
