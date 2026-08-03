package com.oneid.totem.presentation.components

import android.view.HapticFeedbackConstants
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.oneid.totem.presentation.theme.Error
import com.oneid.totem.presentation.theme.OnPrimary
import com.oneid.totem.presentation.theme.OnSurface
import com.oneid.totem.presentation.theme.OnSurfaceVariant
import com.oneid.totem.presentation.theme.Outline
import com.oneid.totem.presentation.theme.Primary
import com.oneid.totem.presentation.theme.Surface
import com.oneid.totem.presentation.theme.SurfaceVariant
import com.oneid.totem.presentation.util.HapticEffect
import kotlin.math.roundToInt

@Composable
fun SecurityCodeDialog(
    description: String,
    onSubmit: (String) -> Boolean,
    onDismiss: () -> Unit,
) {
    var code by remember { mutableStateOf("") }
    var showError by remember { mutableStateOf(false) }
    var shakeTrigger by remember { mutableIntStateOf(0) }
    val shakeOffset = remember { Animatable(0f) }
    val focusRequester = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    LaunchedEffect(shakeTrigger) {
        if (shakeTrigger == 0) return@LaunchedEffect
        shakeOffset.snapTo(-12f)
        repeat(3) {
            shakeOffset.animateTo(12f, tween(durationMillis = 45))
            shakeOffset.animateTo(-12f, tween(durationMillis = 45))
        }
        shakeOffset.animateTo(0f, tween(durationMillis = 45))
    }

    HapticEffect(showError, HapticFeedbackConstants.REJECT)

    fun submit() {
        if (onSubmit(code)) {
            focusManager.clearFocus()
            keyboardController?.hide()
            onDismiss()
        } else {
            showError = true
            shakeTrigger++
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
            usePlatformDefaultWidth = false,
        ),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.6f))
                .imePadding()
                .pointerInput(Unit) {
                    detectTapGestures(onTap = { onDismiss() })
                },
            contentAlignment = Alignment.Center,
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .offset { IntOffset(shakeOffset.value.roundToInt(), 0) }
                    .pointerInput(Unit) { detectTapGestures { } },
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
                border = androidx.compose.foundation.BorderStroke(1.dp, Outline),
            ) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(8.dp),
                    ) {
                        Icon(Icons.Filled.Close, contentDescription = "Fechar", tint = OnSurfaceVariant)
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Spacer(Modifier.height(20.dp))

                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(Primary.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                Icons.Filled.Lock,
                                contentDescription = null,
                                modifier = Modifier.size(28.dp),
                                tint = Primary,
                            )
                        }

                        Spacer(Modifier.height(16.dp))

                        Text(
                            text = "Área restrita",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            color = OnSurface,
                        )

                        Spacer(Modifier.height(8.dp))

                        Text(
                            text = description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = OnSurfaceVariant,
                            textAlign = TextAlign.Center,
                        )

                        Spacer(Modifier.height(24.dp))

                        OutlinedTextField(
                            value = code,
                            onValueChange = {
                                code = it.uppercase().filter(Char::isLetterOrDigit).take(8)
                                showError = false
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .focusRequester(focusRequester),
                            singleLine = true,
                            isError = showError,
                            textStyle = MaterialTheme.typography.headlineMedium.copy(
                                letterSpacing = 10.sp,
                                textAlign = TextAlign.Center,
                            ),
                            placeholder = {
                                Text(
                                    "XXXXXXXX",
                                    style = MaterialTheme.typography.headlineMedium.copy(
                                        letterSpacing = 10.sp,
                                        textAlign = TextAlign.Center,
                                        color = OnSurfaceVariant.copy(alpha = 0.2f),
                                    ),
                                    modifier = Modifier.fillMaxWidth(),
                                )
                            },
                            shape = RoundedCornerShape(16.dp),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Ascii,
                                imeAction = ImeAction.Done,
                            ),
                            keyboardActions = KeyboardActions(onDone = { submit() }),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = if (showError) Error else Primary,
                                unfocusedBorderColor = if (showError) Error else Outline,
                                cursorColor = Primary,
                                focusedTextColor = OnSurface,
                                unfocusedTextColor = OnSurface,
                                focusedContainerColor = Surface,
                                unfocusedContainerColor = Surface,
                            ),
                        )

                        AnimatedVisibility(
                            visible = showError,
                            enter = fadeIn(),
                            exit = fadeOut(),
                        ) {
                            Text(
                                "Código inválido. Tente novamente.",
                                color = Error,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(top = 8.dp),
                            )
                        }

                        Spacer(Modifier.height(24.dp))

                        Button(
                            onClick = { submit() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            enabled = code.length >= 8,
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                        ) {
                            Text(
                                "CONFIRMAR",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 2.sp,
                                ),
                                color = OnPrimary,
                            )
                        }

                        Spacer(Modifier.height(8.dp))

                        TextButton(
                            onClick = onDismiss,
                            colors = ButtonDefaults.textButtonColors(contentColor = OnSurfaceVariant),
                        ) {
                            Text("Cancelar", fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }
    }
}
