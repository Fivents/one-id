package com.oneid.totem.presentation.screens.printer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.data.print.PrinterConnectionType
import com.oneid.totem.data.print.PrinterStatus
import com.oneid.totem.domain.repository.AccessCodeKeyboard
import com.oneid.totem.domain.repository.LabelLayout
import com.oneid.totem.domain.repository.PrintConfig
import com.oneid.totem.presentation.theme.*
import com.oneid.totem.presentation.util.dismissKeyboardOnTapOutside

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrinterSetupScreen(
    onBack: () -> Unit,
    viewModel: PrinterSetupViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        modifier = Modifier.dismissKeyboardOnTapOutside(),
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
                ConnectionTypeSelector(
                    selected = uiState.connectionType,
                    onWifiSelected = viewModel::switchToWifi,
                    onUsbSelected = viewModel::switchToUsb,
                )
            }

            item {
                ConnectionCard(
                    connectionType = uiState.connectionType,
                    isConnected = uiState.isConnected,
                    isConnecting = uiState.isConnecting || uiState.isUsbConnecting,
                    connectedIp = uiState.connectedIp ?: uiState.savedIp,
                    usbDeviceName = uiState.usbDeviceName,
                    status = uiState.connectionStatus,
                    onDisconnect = viewModel::disconnect,
                )
            }

            if (!uiState.isConnected) {
                if (uiState.connectionType == PrinterConnectionType.WIFI) {
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
                        ManualIpSection(
                            manualIp = uiState.manualIp,
                            isConnecting = uiState.isConnecting,
                            onManualIpChanged = viewModel::onManualIpChanged,
                            onConnect = viewModel::connectManual,
                        )
                    }
                } else {
                    item {
                        UsbSection(
                            isAvailable = uiState.usbAvailable,
                            deviceName = uiState.usbDeviceName,
                            isConnecting = uiState.isUsbConnecting,
                            isSearching = uiState.isUsbSearching,
                            onConnect = viewModel::connectUsb,
                            onSearch = viewModel::searchUsb,
                        )
                    }
                }
            }

            item {
                AccessCodeKeyboardSection(
                    selected = uiState.accessCodeKeyboard,
                    onSelect = viewModel::setAccessCodeKeyboard,
                )
            }

            item {
                CheckInHintMessageSection(
                    message = uiState.checkInHintMessage,
                    onMessageChange = viewModel::setCheckInHintMessage,
                )
            }

            item {
                SelfRegisterAutoCheckInSection(
                    enabled = uiState.selfRegisterAutoCheckIn,
                    onEnabledChange = viewModel::setSelfRegisterAutoCheckIn,
                )
            }

            item {
                BadgePreviewSection(
                    bitmap = uiState.previewBitmap,
                    labelLayout = uiState.labelLayout,
                    onLabelLayoutChange = viewModel::setLabelLayout,
                    isTesting = uiState.isTesting,
                    testResult = uiState.testResult,
                    hasPrinter = uiState.isConnected || uiState.connectionType == PrinterConnectionType.USB || (uiState.connectedIp ?: uiState.savedIp).isNotBlank(),
                    onTestPrint = viewModel::testPrint,
                )
            }

            item {
                SecurityCodeSection(
                    enabled = uiState.settingsSecurityCodeEnabled,
                    onEnabledChange = viewModel::setSettingsSecurityCodeEnabled,
                )
            }

            item {
                Spacer(Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun ConnectionTypeSelector(
    selected: PrinterConnectionType,
    onWifiSelected: () -> Unit,
    onUsbSelected: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Tipo de Conexão",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = OnSurface,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Escolha como conectar com a impressora",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))

            val options = listOf(
                PrinterConnectionType.WIFI to "WiFi (Rede)",
                PrinterConnectionType.USB to "USB (Cabo)",
            )
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                options.forEachIndexed { index, (value, label) ->
                    SegmentedButton(
                        selected = selected == value,
                        onClick = {
                            if (selected != value) {
                                if (value == PrinterConnectionType.WIFI) onWifiSelected()
                                else onUsbSelected()
                            }
                        },
                        shape = SegmentedButtonDefaults.itemShape(index = index, count = options.size),
                        // Sem isso, o SegmentedButton soma o ícone de check padrão dele em
                        // cima do nosso ícone + texto, e os dois espremidos não cabem lado
                        // a lado no espaço do segmento.
                        icon = {},
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                if (value == PrinterConnectionType.WIFI) Icons.Filled.Wifi else Icons.Filled.Usb,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                            )
                            Spacer(Modifier.width(6.dp))
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
}

@Composable
private fun ConnectionCard(
    connectionType: PrinterConnectionType,
    isConnected: Boolean,
    isConnecting: Boolean,
    connectedIp: String,
    usbDeviceName: String?,
    status: PrinterStatus?,
    onDisconnect: () -> Unit,
) {
    val icon = when {
        isConnecting -> Icons.Filled.Sync
        isConnected -> Icons.Filled.CheckCircle
        else -> Icons.Filled.Warning
    }
    val iconTint = when {
        isConnecting -> Primary
        isConnected -> Secondary
        else -> MaterialTheme.colorScheme.error
    }
    val title = when {
        isConnecting -> "Conectando..."
        isConnected && connectionType == PrinterConnectionType.USB -> "USB: ${usbDeviceName ?: "Impressora conectada"}"
        isConnected && connectionType == PrinterConnectionType.WIFI -> "Impressora: $connectedIp"
        else -> "Nenhuma impressora conectada"
    }
    val subtitle = when {
        isConnecting -> "Aguardando conexão..."
        isConnected -> statusText(status)
        else -> "Conecte uma impressora para imprimir crachás"
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
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

            if (isConnected) {
                Spacer(Modifier.height(16.dp))
                OutlinedButton(
                    onClick = onDisconnect,
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error,
                    ),
                ) {
                    Icon(Icons.Filled.LinkOff, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Desconectar")
                }
            }
        }
    }
}

@Composable
private fun UsbSection(
    isAvailable: Boolean,
    deviceName: String?,
    isConnecting: Boolean,
    isSearching: Boolean,
    onConnect: () -> Unit,
    onSearch: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Conexão USB",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = OnSurface,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Conecte a impressora via cabo USB ao totem",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))

            if (isSearching) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Primary,
                        strokeWidth = 2.dp,
                    )
                    Spacer(Modifier.width(12.dp))
                    Text("Verificando dispositivos USB...", color = OnSurfaceVariant)
                }
            } else if (isAvailable && deviceName != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        Icons.Filled.Print,
                        contentDescription = null,
                        tint = Secondary,
                        modifier = Modifier.size(28.dp),
                    )
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            deviceName,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = OnSurface,
                        )
                        Text(
                            "Impressora Brother detectada via USB",
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant,
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = onConnect,
                    enabled = !isConnecting,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                ) {
                    if (isConnecting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = OnPrimary,
                            strokeWidth = 2.dp,
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Conectando...", color = OnPrimary)
                    } else {
                        Icon(Icons.Filled.Usb, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Conectar via USB", color = OnPrimary)
                    }
                }
            } else {
                Icon(
                    Icons.Filled.UsbOff,
                    contentDescription = null,
                    tint = OnSurfaceVariant,
                    modifier = Modifier.size(48.dp),
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Nenhuma impressora Brother USB encontrada",
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Verifique se o cabo USB está conectado ao totem",
                    style = MaterialTheme.typography.bodySmall,
                    color = OnSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(12.dp))
                OutlinedButton(
                    onClick = onSearch,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Verificar novamente")
                }
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
private fun CheckInHintMessageSection(
    message: String,
    onMessageChange: (String) -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Mensagem para o Participante",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = OnSurface,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Aparece como dica na tela de digitar o código de acesso. Deixe em branco para não mostrar nada.",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = message,
                onValueChange = onMessageChange,
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                maxLines = 4,
                placeholder = {
                    Text(
                        "Ex.: O código está no e-mail de confirmação da sua inscrição",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant.copy(alpha = 0.6f),
                    )
                },
                shape = RoundedCornerShape(12.dp),
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Sentences,
                    imeAction = ImeAction.Done,
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = Outline,
                    cursorColor = Primary,
                    focusedTextColor = OnSurface,
                    unfocusedTextColor = OnSurface,
                ),
            )

            Spacer(Modifier.height(6.dp))
            Text(
                "${message.length}/${PrinterConfigRepository.CHECKIN_HINT_MAX_LENGTH}",
                style = MaterialTheme.typography.labelSmall,
                color = OnSurfaceVariant.copy(alpha = 0.7f),
                modifier = Modifier.align(Alignment.End),
            )
        }
    }
}

@Composable
private fun SelfRegisterAutoCheckInSection(
    enabled: Boolean,
    onEnabledChange: (Boolean) -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "Check-in Automático no Auto-cadastro",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = OnSurface,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    if (enabled) {
                        "Ligado: quem se cadastra no totem já entra com o check-in feito e o badge sai na hora — uma interação só."
                    } else {
                        "Desligado: o totem só faz o cadastro e entrega o código de acesso. O check-in fica para depois."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = OnSurfaceVariant,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    "O auto-cadastro em si é habilitado pelo evento, no painel web.",
                    style = MaterialTheme.typography.labelSmall,
                    color = OnSurfaceVariant.copy(alpha = 0.7f),
                )
            }
            Spacer(Modifier.width(12.dp))
            Switch(checked = enabled, onCheckedChange = onEnabledChange)
        }
    }
}

@Composable
private fun SecurityCodeSection(
    enabled: Boolean,
    onEnabledChange: (Boolean) -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "Código de Segurança nas Configurações",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = OnSurface,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Se ativado, pede o código do totem para acessar essa tela de configurações",
                    style = MaterialTheme.typography.bodySmall,
                    color = OnSurfaceVariant,
                )
            }
            Spacer(Modifier.width(12.dp))
            Switch(checked = enabled, onCheckedChange = onEnabledChange)
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
private fun ManualIpSection(
    manualIp: String,
    isConnecting: Boolean,
    onManualIpChanged: (String) -> Unit,
    onConnect: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Conectar por IP",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = OnSurface,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Se a busca automática não encontrar a impressora, digite o IP dela na rede",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = manualIp,
                onValueChange = onManualIpChanged,
                label = { Text("Endereço IP") },
                placeholder = { Text("192.168.1.100") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(12.dp))

            Button(
                onClick = onConnect,
                enabled = manualIp.isNotBlank() && !isConnecting,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
            ) {
                if (isConnecting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = OnPrimary,
                        strokeWidth = 2.dp,
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("Conectando...", color = OnPrimary)
                } else {
                    Icon(Icons.Filled.Cable, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Conectar", color = OnPrimary)
                }
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

