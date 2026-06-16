package com.oneid.totem.presentation.util

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.oneid.totem.presentation.theme.ErrorContainer
import com.oneid.totem.presentation.theme.Error
import com.oneid.totem.presentation.theme.OnSurface

@Composable
fun rememberConnectivityState(connectivityMonitor: ConnectivityMonitor): State<Boolean> {
    val isOffline = remember { mutableStateOf(false) }

    LaunchedEffect(connectivityMonitor) {
        connectivityMonitor.isOnline.collect { online ->
            isOffline.value = !online
        }
    }

    return isOffline
}

@Composable
fun OfflineBanner(isOffline: Boolean) {
    AnimatedVisibility(
        visible = isOffline,
        enter = expandVertically(expandFrom = Alignment.Top) + fadeIn(),
        exit = shrinkVertically(shrinkTowards = Alignment.Top) + fadeOut(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(ErrorContainer)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            Icon(Icons.Filled.WifiOff, contentDescription = null, tint = Error, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(8.dp))
            Text(
                text = "Sem conexão com a internet",
                style = MaterialTheme.typography.bodySmall,
                color = Error,
            )
        }
    }
}
