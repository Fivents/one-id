package com.oneid.totem.presentation.screens.checkin.code

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Keyboard
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.presentation.theme.*

@Composable
fun CodeCheckInScreen(
    onSuccess: (checkInId: String, eventParticipantId: String, participantName: String) -> Unit,
    onBack: () -> Unit,
    viewModel: CodeCheckInViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.success) {
        uiState.success?.let { (id, epId, name) -> onSuccess(id, epId, name) }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, "Voltar", tint = OnSurface)
                }
                Spacer(Modifier.weight(1f))
                Text(
                    text = "ONE-ID",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 3.sp,
                    ),
                    color = Primary,
                )
                Spacer(Modifier.weight(1f))
            }

            Spacer(Modifier.height(56.dp))

            Icon(
                imageVector = Icons.Filled.Keyboard,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = Primary,
            )

            Spacer(Modifier.height(24.dp))

            Text(
                text = "Código de acesso",
                style = MaterialTheme.typography.headlineLarge,
                color = OnSurface,
            )

            Text(
                text = "Digite o código recebido no convite",
                style = MaterialTheme.typography.bodyMedium,
                color = OnSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp),
            )

            Spacer(Modifier.height(40.dp))

            OutlinedTextField(
                value = uiState.code,
                onValueChange = viewModel::onCodeChanged,
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                enabled = !uiState.isLoading,
                isError = uiState.error != null,
                textStyle = MaterialTheme.typography.displayMedium.copy(
                    letterSpacing = 12.sp,
                    textAlign = TextAlign.Center,
                ),
                placeholder = {
                    Text(
                        text = "000000",
                        style = MaterialTheme.typography.displayMedium.copy(
                            letterSpacing = 12.sp,
                            textAlign = TextAlign.Center,
                            color = OnSurfaceVariant.copy(alpha = 0.3f),
                        ),
                        modifier = Modifier.fillMaxWidth(),
                    )
                },
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

            AnimatedVisibility(visible = uiState.isLoading) {
                LinearProgressIndicator(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    color = Primary,
                )
            }

            AnimatedVisibility(visible = uiState.error != null) {
                Text(
                    text = uiState.error ?: "",
                    color = Error,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 16.dp),
                )
            }

            Spacer(Modifier.weight(1f))

            Button(
                onClick = viewModel::submitCode,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = uiState.code.length >= 4 && !uiState.isLoading,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
            ) {
                Text("CONFIRMAR", style = MaterialTheme.typography.titleMedium, color = OnPrimary)
            }
        }
    }
}
