package com.oneid.totem.presentation.screens.printer

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Print
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
import com.oneid.totem.domain.repository.LabelLayout
import com.oneid.totem.presentation.theme.OnPrimary
import com.oneid.totem.presentation.theme.OnSurface
import com.oneid.totem.presentation.theme.OnSurfaceVariant
import com.oneid.totem.presentation.theme.Outline
import com.oneid.totem.presentation.theme.Primary
import com.oneid.totem.presentation.theme.Secondary
import com.oneid.totem.presentation.theme.Surface
import java.text.DecimalFormat

private const val PREVIEW_DPI = 300
private val MM_FORMAT = DecimalFormat("0.#")

/**
 * O bitmap exibido aqui é o mesmo que [onTestPrint] envia pra impressora — o preview
 * é sempre fiel ao que sai na etiqueta de teste, sem dados/composição divergentes.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BadgePreviewSection(
    bitmap: Bitmap?,
    labelLayout: LabelLayout,
    onLabelLayoutChange: (LabelLayout) -> Unit = {},
    isTesting: Boolean,
    testResult: String?,
    hasPrinter: Boolean,
    onTestPrint: () -> Unit,
    modifier: Modifier = Modifier,
) {
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

            Spacer(Modifier.height(20.dp))
            HorizontalDivider(color = Outline.copy(alpha = 0.3f))
            Spacer(Modifier.height(20.dp))

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
                    modifier = Modifier.fillMaxWidth(),
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LabelLayoutSelector(
    selected: LabelLayout,
    onSelect: (LabelLayout) -> Unit,
) {
    val options = listOf(
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
