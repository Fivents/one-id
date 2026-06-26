package com.oneid.totem.presentation.screens.checkin.qr

import android.Manifest
import android.content.pm.PackageManager
import android.util.Size
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.FlashOff
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.presentation.theme.*

@Composable
fun QrCheckInScreen(
    onSuccess: (checkInId: String, eventParticipantId: String, participantName: String) -> Unit,
    onBack: () -> Unit,
    viewModel: QrCheckInViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) viewModel.checkCameraPermission(context)
        else viewModel.checkCameraPermission(context)
    }

    LaunchedEffect(uiState.success) {
        uiState.success?.let { (id, epId, name) -> onSuccess(id, epId, name) }
    }

    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            viewModel.checkCameraPermission(context)
        } else {
            viewModel.checkCameraPermission(context)
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    DisposableEffect(Unit) {
        onDispose { viewModel.reset() }
    }

    val analyzer = remember { viewModel.createAnalyzer() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Surface),
                ) {
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

            when {
                uiState.hasCameraPermission == false -> {
                    Column(
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text("Permissão de câmera necessária", color = OnSurface, style = MaterialTheme.typography.titleLarge)
                        Spacer(Modifier.height(16.dp))
                        Button(
                            onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                        ) { Text("Conceder permissão", fontWeight = FontWeight.Bold) }
                    }
                }

                uiState.hasCameraPermission == true -> {
                    Spacer(Modifier.height(24.dp))

                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Secondary.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            Icons.Filled.QrCodeScanner,
                            contentDescription = null,
                            modifier = Modifier.size(28.dp),
                            tint = Secondary,
                        )
                    }

                    Spacer(Modifier.height(16.dp))

                    Text(
                        text = "Leia o QR Code",
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                        color = OnSurface,
                    )
                    Text(
                        "Posicione o QR Code na área indicada",
                        style = MaterialTheme.typography.bodyLarge,
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp, bottom = 24.dp),
                    )

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .padding(horizontal = 32.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            modifier = Modifier
                                .aspectRatio(1f)
                                .clip(RoundedCornerShape(32.dp)),
                        ) {
                            AndroidView(
                                factory = { ctx ->
                                    PreviewView(ctx).apply {
                                        scaleType = PreviewView.ScaleType.FILL_CENTER
                                        implementationMode = PreviewView.ImplementationMode.COMPATIBLE

                                        val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                                        cameraProviderFuture.addListener({
                                            val cameraProvider = cameraProviderFuture.get()

                                            val preview = Preview.Builder().build().also {
                                                it.surfaceProvider = surfaceProvider
                                            }
                                            val analysis = ImageAnalysis.Builder()
                                                .setTargetResolution(Size(1280, 720))
                                                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                                .build()
                                                .also { it.setAnalyzer(ContextCompat.getMainExecutor(ctx), analyzer) }

                                            val selector = CameraSelector.Builder()
                                                .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                                                .build()

                                            try {
                                                cameraProvider.unbindAll()
                                                cameraProvider.bindToLifecycle(lifecycleOwner, selector, preview, analysis)
                                            } catch (_: Exception) { }
                                        }, ContextCompat.getMainExecutor(ctx))
                                    }
                                },
                                modifier = Modifier.fillMaxSize(),
                            )

                            if (uiState.isLoading) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(Background.copy(alpha = 0.6f)),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        CircularProgressIndicator(color = Primary)
                                        Spacer(Modifier.height(12.dp))
                                        Text("Verificando...", color = OnSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(20.dp))

                    IconButton(
                        onClick = { viewModel.toggleTorch() },
                        modifier = Modifier
                            .size(52.dp)
                            .background(Surface, CircleShape),
                    ) {
                        Icon(
                            imageVector = if (uiState.torchEnabled) Icons.Filled.FlashOn else Icons.Filled.FlashOff,
                            contentDescription = "Lanterna",
                            tint = if (uiState.torchEnabled) Primary else OnSurfaceVariant,
                        )
                    }

                    Spacer(Modifier.height(16.dp))

                    AnimatedVisibility(
                        visible = uiState.isLoading,
                        enter = fadeIn(),
                        exit = fadeOut(),
                    ) {
                        LinearProgressIndicator(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 32.dp),
                            color = Primary,
                        )
                    }

                    AnimatedVisibility(
                        visible = uiState.error != null,
                        enter = fadeIn(),
                        exit = fadeOut(),
                    ) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 12.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = ErrorContainer),
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(Icons.Filled.ErrorOutline, contentDescription = null, tint = Error, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(12.dp))
                                Text(
                                    uiState.error ?: "",
                                    color = Error,
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.weight(1f),
                                )
                                TextButton(onClick = { viewModel.dismissError() }) {
                                    Text("OK", color = Error, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(24.dp))
                }

                else -> {
                    CircularProgressIndicator(
                        color = Primary,
                        modifier = Modifier.align(Alignment.CenterHorizontally),
                    )
                }
            }
        }
    }
}
