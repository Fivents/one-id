package com.oneid.totem.presentation.screens.checkin.face

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
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Face
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.presentation.theme.*
import com.oneid.totem.presentation.util.HapticEffect
import androidx.compose.ui.unit.sp

@Composable
fun FaceCheckInScreen(
    onSuccess: (checkInId: String, eventParticipantId: String, participantName: String) -> Unit,
    onError: (message: String) -> Unit,
    onBack: () -> Unit,
    viewModel: FaceCheckInViewModel = hiltViewModel(),
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
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            viewModel.checkCameraPermission(context)
        } else {
            viewModel.checkCameraPermission(context)
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    DisposableEffect(Unit) {
        onDispose { viewModel.reset() }
    }

    HapticEffect(trigger = uiState.faceDetected, feedbackType = android.view.HapticFeedbackConstants.CONFIRM)

    val analyzer = remember { viewModel.createAnalyzer() }

    val scanBorderAlpha = rememberInfiniteTransition(label = "scan").animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "scanBorder",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        when {
            uiState.hasCameraPermission == false -> {
                Column(
                    modifier = Modifier.align(Alignment.Center).padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text("Permissão de câmera necessária", color = OnSurface)
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                        colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    ) { Text("Conceder permissão") }
                }
            }

            uiState.hasCameraPermission == true -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Filled.ArrowBack, "Voltar", tint = OnSurface)
                        }
                        Spacer(Modifier.weight(1f))
                        Text(
                            text = "ONE-ID",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold, letterSpacing = 3.sp,
                            ),
                            color = Primary,
                        )
                        Spacer(Modifier.weight(1f))
                    }

                    Box(
                        modifier = Modifier.fillMaxWidth().weight(1f).padding(horizontal = 24.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(300.dp)
                                .clip(RoundedCornerShape(24.dp))
                                .border(
                                    width = 2.dp,
                                    color = if (uiState.faceInFrame) Primary.copy(alpha = scanBorderAlpha.value)
                                    else Outline.copy(alpha = 0.3f),
                                    shape = RoundedCornerShape(24.dp),
                                ),
                        ) {
                            Box(modifier = Modifier.fillMaxSize()) {
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
                                                    .setTargetResolution(Size(640, 480))
                                                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                                    .build()
                                                    .also { it.setAnalyzer(ContextCompat.getMainExecutor(ctx), analyzer) }

                                                val selector = CameraSelector.Builder()
                                                    .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
                                                    .build()

                                                try {
                                                    cameraProvider.unbindAll()
                                                    cameraProvider.bindToLifecycle(
                                                        lifecycleOwner, selector, preview, analysis
                                                    )
                                                } catch (_: Exception) { }
                                            }, ContextCompat.getMainExecutor(ctx))
                                        }
                                    },
                                    modifier = Modifier.fillMaxSize(),
                                )

                                if (uiState.isLoading) {
                                    Box(
                                        modifier = Modifier.fillMaxSize().background(Background.copy(alpha = 0.7f)),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            CircularProgressIndicator(color = Primary)
                                            Spacer(Modifier.height(12.dp))
                                            Text("Verificando...", color = OnSurfaceVariant)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(24.dp))
                    Text(
                        text = "Posicione o rosto centralizado",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurfaceVariant,
                        modifier = Modifier.align(Alignment.CenterHorizontally),
                    )

                    Spacer(Modifier.height(16.dp))

                    AnimatedVisibility(visible = uiState.isLoading) {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
                            color = Primary,
                        )
                    }

                    AnimatedVisibility(visible = uiState.error != null) {
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp, vertical = 16.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = ErrorContainer),
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(uiState.error ?: "", color = Error, modifier = Modifier.weight(1f))
                                TextButton(onClick = { viewModel.dismissError() }) { Text("OK", color = Error) }
                            }
                        }
                    }

                    Spacer(Modifier.height(24.dp))
                }
            }

            else -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Primary,
                )
            }
        }
    }
}
