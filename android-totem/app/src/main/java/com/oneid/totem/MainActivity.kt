package com.oneid.totem

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.oneid.totem.presentation.navigation.NavGraph
import com.oneid.totem.presentation.theme.OneIdTheme
import com.oneid.totem.presentation.util.ConnectivityMonitor
import com.oneid.totem.presentation.util.OfflineBanner
import com.oneid.totem.presentation.util.rememberConnectivityState
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject lateinit var connectivityMonitor: ConnectivityMonitor

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val isOffline by rememberConnectivityState(connectivityMonitor)

            OneIdTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        NavGraph()
                        Box(modifier = Modifier.align(Alignment.TopCenter)) {
                            OfflineBanner(isOffline = isOffline)
                        }
                    }
                }
            }
        }
    }
}
