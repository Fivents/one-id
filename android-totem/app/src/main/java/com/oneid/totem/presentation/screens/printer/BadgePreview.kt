package com.oneid.totem.presentation.screens.printer

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.oneid.totem.data.print.BadgeRenderer
import com.oneid.totem.domain.repository.LabelLayout
import com.oneid.totem.presentation.theme.OnSurface
import com.oneid.totem.presentation.theme.OnSurfaceVariant
import com.oneid.totem.presentation.theme.Outline
import com.oneid.totem.presentation.theme.Primary
import com.oneid.totem.presentation.theme.Surface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.DecimalFormat

private const val PREVIEW_DPI = 300
private val MM_FORMAT = DecimalFormat("0.#")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BadgePreviewSection(
    paperWidthMm: Double,
    paperHeightMm: Double,
    labelLayout: LabelLayout,
    badgeRenderer: BadgeRenderer,
    showQrCode: Boolean,
    showAccessCode: Boolean,
    participantName: String = "Maria Silva",
    company: String? = "Empresa Exemplo",
    jobTitle: String? = "Diretora de Marketing",
    eventName: String = "EVENTO DE TESTE",
    accessCode: String? = "PREVIEW-001",
    onLabelLayoutChange: (LabelLayout) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(
        labelLayout,
        showQrCode,
        showAccessCode,
        participantName,
        company,
        jobTitle,
        eventName,
        accessCode,
        paperWidthMm,
        paperHeightMm,
    ) {
        bitmap = withContext(Dispatchers.Default) {
            badgeRenderer.renderFromData(
                name = participantName,
                company = company,
                jobTitle = jobTitle,
                qrCodeValue = "preview-qr-001",
                accessCode = accessCode,
                showQrCode = showQrCode,
                showAccessCode = showAccessCode,
                eventName = eventName,
                paperWidthMm = paperWidthMm,
                paperHeightMm = paperHeightMm,
                dpi = PREVIEW_DPI,
                labelLayout = labelLayout,
            )
        }
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "Preview da Etiqueta",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = OnSurface,
            )

            Spacer(Modifier.height(4.dp))

            Text(
                "Visualização fiel do que será impresso",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
            )

            Spacer(Modifier.height(16.dp))

            LabelLayoutSelector(
                selected = labelLayout,
                onSelect = onLabelLayoutChange,
            )

            Spacer(Modifier.height(16.dp))

            BadgeBitmapPreview(
                bitmap = bitmap,
                dpi = PREVIEW_DPI,
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LabelLayoutSelector(
    selected: LabelLayout,
    onSelect: (LabelLayout) -> Unit,
) {
    val options = listOf(
        LabelLayout.STANDARD to "Padrão",
        LabelLayout.COMPACT to "Compacto",
        LabelLayout.MINIMAL_QR to "Mínimo",
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

@Composable
private fun BadgeBitmapPreview(
    bitmap: Bitmap?,
    dpi: Int,
) {
    if (bitmap == null) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(28.dp),
                color = Primary,
                strokeWidth = 3.dp,
            )
        }
        return
    }

    val maxWidthDp = 280.dp
    val maxHeightDp = 340.dp
    val aspect = bitmap.width.toFloat() / bitmap.height.toFloat()
    var widthDp = maxWidthDp
    var heightDp = widthDp / aspect
    if (heightDp > maxHeightDp) {
        heightDp = maxHeightDp
        widthDp = heightDp * aspect
    }

    val widthMm = bitmap.width * 25.4 / dpi
    val heightMm = bitmap.height * 25.4 / dpi

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "Preview da etiqueta",
            modifier = Modifier
                .width(widthDp)
                .height(heightDp)
                .clip(RoundedCornerShape(4.dp))
                .background(Color.White)
                .border(1.dp, Outline.copy(alpha = 0.4f), RoundedCornerShape(4.dp)),
            contentScale = ContentScale.FillBounds,
            filterQuality = FilterQuality.None,
        )

        Spacer(Modifier.height(10.dp))

        Text(
            "${MM_FORMAT.format(widthMm)} × ${MM_FORMAT.format(heightMm)} mm",
            style = MaterialTheme.typography.labelMedium,
            color = OnSurfaceVariant.copy(alpha = 0.8f),
        )
    }
}
