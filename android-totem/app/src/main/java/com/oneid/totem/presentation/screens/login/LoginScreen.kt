package com.oneid.totem.presentation.screens.login

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.presentation.theme.*

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) onLoginSuccess()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.widthIn(max = 420.dp).padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "ONE-ID",
                style = MaterialTheme.typography.displayLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 42.sp,
                    letterSpacing = 6.sp,
                ),
                color = Primary,
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = "Totem de Check-in",
                style = MaterialTheme.typography.bodyLarge,
                color = OnSurfaceVariant,
            )

            Spacer(Modifier.height(48.dp))

            OutlinedTextField(
                value = uiState.key,
                onValueChange = viewModel::onKeyChanged,
                label = { Text("Código de acesso") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                enabled = !uiState.isLoading,
                isError = uiState.error != null,
                textStyle = MaterialTheme.typography.headlineMedium.copy(
                    letterSpacing = 8.sp,
                    textAlign = TextAlign.Center,
                ),
                shape = RoundedCornerShape(16.dp),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Ascii,
                    imeAction = ImeAction.Go,
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = Outline,
                    cursorColor = Primary,
                    focusedLabelColor = Primary,
                    unfocusedLabelColor = OnSurfaceVariant,
                    focusedTextColor = OnSurface,
                    unfocusedTextColor = OnSurface,
                    focusedContainerColor = Surface,
                    unfocusedContainerColor = Surface,
                ),
            )

            AnimatedVisibility(visible = uiState.error != null) {
                Text(
                    text = uiState.error ?: "",
                    color = Error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = viewModel::login,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                enabled = uiState.key.length >= 4 && !uiState.isLoading,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = OnPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Text(
                        text = "ENTRAR",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnPrimary,
                    )
                }
            }
        }

        IconButton(
            onClick = viewModel::openServerDialog,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .size(48.dp)
                .background(Surface, CircleShape),
        ) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Configurar servidor",
                tint = OnSurfaceVariant,
            )
        }
    }

    if (uiState.showServerDialog) {
        AlertDialog(
            onDismissRequest = viewModel::dismissServerDialog,
            title = {
                Text("Configurar Servidor", fontWeight = FontWeight.Bold)
            },
            text = {
                Column {
                    Text(
                        text = "Digite a URL do servidor One-ID:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = uiState.serverUrl,
                        onValueChange = viewModel::onServerUrlChanged,
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        label = { Text("URL do servidor") },
                        placeholder = { Text("http://10.0.2.2:3000") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                        shape = RoundedCornerShape(8.dp),
                    )
                }
            },
            confirmButton = {
                Button(onClick = viewModel::saveServerUrl) {
                    Text("Salvar")
                }
            },
            dismissButton = {
                TextButton(onClick = viewModel::dismissServerDialog) {
                    Text("Cancelar")
                }
            },
            containerColor = Surface,
            titleContentColor = OnSurface,
            textContentColor = OnSurfaceVariant,
        )
    }
}
