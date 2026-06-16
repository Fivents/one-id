package com.oneid.totem.presentation.screens.method

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.presentation.theme.*

@Composable
fun MethodScreen(
    onNavigateToFace: () -> Unit,
    onNavigateToQr: () -> Unit,
    onNavigateToCode: () -> Unit,
    onNavigateToSelfRegister: () -> Unit,
    onLogout: () -> Unit,
    viewModel: MethodViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    val modelState by viewModel.modelDownloadState.collectAsState()

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
                Button(onClick = viewModel::refresh, shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.buttonColors(containerColor = Primary)) {
                    Text("Tentar novamente", fontWeight = FontWeight.Bold)
                }
            }
        } else {
            val event = uiState.session!!.activeEvent

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "ONE-ID",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 4.sp,
                        ),
                        color = Primary,
                    )
                    Spacer(Modifier.weight(1f))
                    Text(
                        text = event.name,
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant,
                    )
                }

                Spacer(Modifier.height(48.dp))

                Text(
                    text = "Escolha o método",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                    color = OnSurface,
                )
                Text(
                    text = "Selecione como deseja fazer o check-in",
                    style = MaterialTheme.typography.bodyLarge,
                    color = OnSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp),
                )

                Spacer(Modifier.height(24.dp))

                when (val ms = modelState) {
                    is com.oneid.totem.data.service.ModelDownloadState.Progress -> {
                        val pct = (ms.percent * 100).toInt()
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            LinearProgressIndicator(
                                progress = { ms.percent },
                                modifier = Modifier.fillMaxWidth().height(4.dp),
                                color = Primary,
                                trackColor = Surface,
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                "Preparando reconhecimento facial... $pct%",
                                style = MaterialTheme.typography.labelSmall,
                                color = OnSurfaceVariant,
                            )
                        }
                        Spacer(Modifier.height(16.dp))
                    }
                    is com.oneid.totem.data.service.ModelDownloadState.Error -> {
                        Text(
                            "Reconhecimento facial indisponível",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        )
                        Spacer(Modifier.height(16.dp))
                    }
                    else -> { Spacer(Modifier.height(8.dp)) }
                }

                val hasMultiple = listOf(event.faceEnabled, event.qrEnabled, event.codeEnabled).count { it } > 1

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    if (event.faceEnabled) {
                        MethodCard(
                            title = "Reconhecimento\nFacial",
                            icon = Icons.Filled.Face,
                            onClick = onNavigateToFace,
                            modifier = Modifier.weight(1f),
                            accentColor = Primary,
                        )
                    }
                    if (event.qrEnabled) {
                        MethodCard(
                            title = "QR Code",
                            icon = Icons.Filled.QrCodeScanner,
                            onClick = onNavigateToQr,
                            modifier = Modifier.weight(1f),
                            accentColor = Secondary,
                        )
                    }
                    if (event.codeEnabled) {
                        MethodCard(
                            title = "Código de\nAcesso",
                            icon = Icons.Filled.Keyboard,
                            onClick = onNavigateToCode,
                            modifier = Modifier.weight(1f),
                            accentColor = Color(0xFFF59E0B),
                        )
                    }
                }

                if (event.allowSelfRegistration) {
                    Spacer(Modifier.height(20.dp))
                    OutlinedButton(
                        onClick = onNavigateToSelfRegister,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary),
                        border = ButtonDefaults.outlinedButtonBorder(enabled = true),
                    ) {
                        Icon(Icons.Filled.PersonAdd, contentDescription = null, modifier = Modifier.size(22.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Sou novo aqui — Quero me cadastrar", fontWeight = FontWeight.Medium)
                    }
                }

                Spacer(Modifier.weight(1f))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    TextButton(
                        onClick = viewModel::logout,
                        colors = ButtonDefaults.textButtonColors(contentColor = OnSurfaceVariant),
                    ) {
                        @Suppress("DEPRECATION")
                    Icon(Icons.Filled.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Sair")
                    }
                }
            }
        }
    }
}

@Composable
private fun MethodCard(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    accentColor: androidx.compose.ui.graphics.Color = Primary,
) {
    Card(
        onClick = onClick,
        modifier = modifier.height(180.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(accentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        modifier = Modifier.size(28.dp),
                        tint = accentColor,
                    )
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                    textAlign = TextAlign.Center,
                    color = OnSurface,
                )
            }
        }
    }
}
