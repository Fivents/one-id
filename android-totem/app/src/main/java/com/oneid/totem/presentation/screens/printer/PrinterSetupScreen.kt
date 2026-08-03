package com.oneid.totem.presentation.screens.printer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.data.print.PrinterStatus
import com.oneid.totem.domain.repository.AccessCodeKeyboard
import com.oneid.totem.domain.repository.LabelLayout
import com.oneid.totem.domain.repository.PrintConfig
import com.oneid.totem.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrinterSetupScreen(
    onBack: () -> Unit,
    viewModel: PrinterSetupViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Configurar Impressora",
                        fontWeight = FontWeight.Bold,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Surface,
                    titleContentColor = OnSurface,
                    navigationIconContentColor = OnSurface,
                ),
            )
        },
        containerColor = Background,
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
        ) {
            item {
                ConnectionStatusCard(
                    connectedIp = uiState.connectedIp ?: uiState.savedIp,
                    status = uiState.connectionStatus,
                    isConnecting = uiState.isConnecting,
                )
            }

            item {
                SearchSection(
                    isSearching = uiState.isSearching,
                    searchError = uiState.searchError,
                    onSearch = viewModel::startSearch,
                    onCancel = viewModel::cancelSearch,
                )
            }

            if (uiState.discoveredPrinters.isNotEmpty()) {
                item {
                    Text(
                        "Impressoras encontradas",
                        style = MaterialTheme.typography.titleSmall,
                        color = OnSurfaceVariant,
                    )
                }
                items(uiState.discoveredPrinters, key = { it.ipAddress }) { printer ->
                    PrinterCard(
                        printer = printer,
                        isConnected = printer.ipAddress == uiState.connectedIp,
                        onClick = { viewModel.selectPrinter(printer.ipAddress) },
                    )
                }
            }

            item {
                TestPrintSection(
                    isTesting = uiState.isTesting,
                    testResult = uiState.testResult,
                    hasPrinter = (uiState.connectedIp ?: uiState.savedIp).isNotBlank(),
                    onTestPrint = viewModel::testPrint,
                )
            }

            item {
                AccessCodeKeyboardSection(
                    selected = uiState.accessCodeKeyboard,
                    onSelect = viewModel::setAccessCodeKeyboard,
                )
            }

            item {
                uiState.printConfig?.let { config ->
                    BadgePreviewSection(
                        paperWidthMm = config.paperWidth,
                        paperHeightMm = config.paperHeight,
                        labelLayout = uiState.labelLayout,
                        badgeRenderer = viewModel.badgeRenderer,
                        showQrCode = config.showQrCode,
                        showAccessCode = config.showAccessCode,
                        eventName = "EVENTO",
                        onLabelLayoutChange = viewModel::setLabelLayout,
                    )
                }
            }

            item {
                Spacer(Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun ConnectionStatusCard(
    connectedIp: String,
    status: PrinterStatus?,
    isConnecting: Boolean,
) {
    val isConfigured = connectedIp.isNotBlank()
    val icon = when {
        isConnecting -> Icons.Filled.Sync
        isConfigured -> Icons.Filled.CheckCircle
        else -> Icons.Filled.Warning
    }
    val iconTint = when {
        isConnecting -> Primary
        isConfigured -> Secondary
        else -> MaterialTheme.colorScheme.error
    }
    val title = when {
        isConnecting -> "Conectando..."
        isConfigured -> "Impressora: $connectedIp"
        else -> "Nenhuma impressora configurada"
    }
    val subtitle = when {
        isConnecting -> "Aguardando conexão..."
        isConfigured -> statusText(status)
        else -> "Configure uma impressora para imprimir crachás"
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (isConnecting) {
                CircularProgressIndicator(
                    modifier = Modifier.size(32.dp),
                    color = Primary,
                    strokeWidth = 3.dp,
                )
            } else {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(32.dp),
                )
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(title, style = MaterialTheme.typography.bodyLarge, color = OnSurface)
                Spacer(Modifier.height(2.dp))
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
            }
        }
    }
}

@Composable
private fun AccessCodeKeyboardSection(
    selected: AccessCodeKeyboard,
    onSelect: (AccessCodeKeyboard) -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Teclado do Código de Acesso",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = OnSurface,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Define o teclado que o participante usa ao digitar o código no check-in",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))

            val options = listOf(
                AccessCodeKeyboard.ALPHANUMERIC to "Alfanumérico",
                AccessCodeKeyboard.NUMERIC to "Numérico",
            )
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                options.forEachIndexed { index, (value, label) ->
                    SegmentedButton(
                        selected = selected == value,
                        onClick = { onSelect(value) },
                        shape = SegmentedButtonDefaults.itemShape(index = index, count = options.size),
                    ) {
                        Text(
                            label,
                            style = MaterialTheme.typography.labelMedium,
                            maxLines = 1,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun statusText(status: PrinterStatus?): String {
    return when (status) {
        PrinterStatus.OK -> "Conectada e pronta"
        PrinterStatus.PAPER_EMPTY -> "Sem papel"
        PrinterStatus.BATTERY_LOW -> "Bateria fraca"
        PrinterStatus.COVER_OPEN -> "Tampa aberta"
        PrinterStatus.OVERHEAT -> "Superaquecida"
        PrinterStatus.BUSY -> "Ocupada"
        PrinterStatus.PRINTING -> "Imprimindo..."
        PrinterStatus.ERROR -> "Erro na impressora"
        PrinterStatus.NO_MEDIA -> "Sem mídia"
        PrinterStatus.UNKNOWN -> null
        else -> null
    } ?: "Conectada"
}

@Composable
private fun SearchSection(
    isSearching: Boolean,
    searchError: String?,
    onSearch: () -> Unit,
    onCancel: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Busca Automática",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = OnSurface,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Descubra impressoras Brother na rede WiFi",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))

            if (isSearching) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Primary,
                        strokeWidth = 2.dp,
                    )
                    Spacer(Modifier.width(12.dp))
                    Text("Buscando impressoras...", color = OnSurfaceVariant)
                    Spacer(Modifier.weight(1f))
                    TextButton(onClick = onCancel) {
                        Text("Cancelar", color = Primary)
                    }
                }
            } else {
                Button(
                    onClick = onSearch,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                ) {
                    Icon(Icons.Filled.Search, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Buscar impressoras na rede")
                }
            }

            searchError?.let { error ->
                Spacer(Modifier.height(12.dp))
                Text(
                    error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun PrinterCard(
    printer: DiscoveredPrinter,
    isConnected: Boolean,
    onClick: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isConnected) Primary.copy(alpha = 0.12f) else SurfaceVariant,
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                Icons.Filled.Print,
                contentDescription = null,
                tint = if (isConnected) Primary else OnSurfaceVariant,
                modifier = Modifier.size(28.dp),
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    printer.modelName,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = OnSurface,
                )
                Text(
                    printer.ipAddress,
                    style = MaterialTheme.typography.bodySmall,
                    color = OnSurfaceVariant,
                )
                printer.nodeName?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                }
            }
            if (isConnected) {
                Icon(
                    Icons.Filled.CheckCircle,
                    contentDescription = "Conectado",
                    tint = Secondary,
                    modifier = Modifier.size(20.dp),
                )
            } else {
                Icon(
                    Icons.Filled.Cable,
                    contentDescription = "Conectar",
                    tint = Primary,
                    modifier = Modifier.size(20.dp),
                )
            }
        }
    }
}

@Composable
private fun TestPrintSection(
    isTesting: Boolean,
    testResult: String?,
    hasPrinter: Boolean,
    onTestPrint: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Impressão de Teste",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = OnSurface,
            )
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = onTestPrint,
                enabled = hasPrinter && !isTesting,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (hasPrinter) Secondary else Secondary.copy(alpha = 0.4f),
                ),
            ) {
                if (isTesting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = OnPrimary,
                        strokeWidth = 2.dp,
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("Imprimindo...", color = OnPrimary)
                } else {
                    Icon(Icons.Filled.Print, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Imprimir Teste", color = OnPrimary)
                }
            }

            testResult?.let { result ->
                Spacer(Modifier.height(12.dp))
                val isSuccess = result.startsWith("Impressão de teste bem-sucedida")
                Card(
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSuccess) Secondary.copy(alpha = 0.12f) else MaterialTheme.colorScheme.error.copy(alpha = 0.12f),
                    ),
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            if (isSuccess) Icons.Filled.CheckCircle else Icons.Filled.Error,
                            contentDescription = null,
                            tint = if (isSuccess) Secondary else MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            result,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isSuccess) Secondary else MaterialTheme.colorScheme.error,
                        )
                    }
                }
            }
        }
    }
}
