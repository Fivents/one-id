package com.oneid.totem.presentation.screens.printer

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.oneid.totem.domain.repository.LabelLayout
import com.oneid.totem.presentation.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

private const val CSS_SCALE_FACTOR = 25.4f / 96f * 2.2f
private const val DISPLAY_DPI = 72
private const val MIN_QR_SIZE_PX = 40
private const val MAX_QR_MM = 18.0
private const val MAX_QR_COMPACT_MM = 16.0

@Composable
fun BadgePreviewSection(
    paperWidthMm: Double,
    paperHeightMm: Double,
    orientation: String,
    labelLayout: LabelLayout = LabelLayout.STANDARD,
    showQrCode: Boolean,
    showAccessCode: Boolean,
    fontSizeName: Int = 13,
    fontSizeMeta: Int = 9,
    participantName: String = "Maria Silva",
    company: String? = "Empresa Exemplo",
    jobTitle: String? = "Diretora de Marketing",
    eventName: String = "EVENTO DE TESTE",
    accessCode: String? = "PREVIEW-001",
    onOrientationChange: (String) -> Unit,
    onLabelLayoutChange: (LabelLayout) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val isLandscape = orientation == "LANDSCAPE"

    val displayWidthMm = if (isLandscape) paperWidthMm else paperHeightMm
    val displayHeightMm = if (isLandscape) paperHeightMm else paperWidthMm

    var qrBitmap by remember { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(showQrCode) {
        qrBitmap = if (showQrCode) {
            generateQrCodeBitmap("preview-qr-001", 200)
        } else null
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
                "Visualização baseada nas configurações atuais",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
            )

            Spacer(Modifier.height(16.dp))

            OrientationToggle(
                isLandscape = isLandscape,
                onCheckedChange = { checked ->
                    onOrientationChange(if (checked) "LANDSCAPE" else "PORTRAIT")
                },
            )

            Spacer(Modifier.height(12.dp))

            LabelLayoutToggle(
                labelLayout = labelLayout,
                onCheckedChange = onLabelLayoutChange,
            )

            Spacer(Modifier.height(16.dp))

            BadgeCanvasWithDimensions(
                displayWidthMm = displayWidthMm,
                displayHeightMm = displayHeightMm,
                labelLayout = labelLayout,
                showQrCode = showQrCode,
                showAccessCode = showAccessCode,
                fontSizeName = fontSizeName,
                fontSizeMeta = fontSizeMeta,
                participantName = participantName,
                company = company,
                jobTitle = jobTitle,
                eventName = eventName,
                accessCode = accessCode,
                qrBitmap = qrBitmap,
            )
        }
    }
}

@Composable
private fun OrientationToggle(
    isLandscape: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            "Retrato",
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = if (!isLandscape) FontWeight.SemiBold else FontWeight.Normal,
            ),
            color = if (!isLandscape) OnSurface else OnSurfaceVariant,
        )

        Spacer(Modifier.width(12.dp))

        Switch(
            checked = isLandscape,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Primary,
                checkedTrackColor = Primary.copy(alpha = 0.4f),
                uncheckedThumbColor = OnSurfaceVariant,
                uncheckedTrackColor = OnSurfaceVariant.copy(alpha = 0.2f),
            ),
        )

        Spacer(Modifier.width(12.dp))

        Text(
            "Paisagem",
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = if (isLandscape) FontWeight.SemiBold else FontWeight.Normal,
            ),
            color = if (isLandscape) OnSurface else OnSurfaceVariant,
        )
    }
}

@Composable
private fun LabelLayoutToggle(
    labelLayout: LabelLayout,
    onCheckedChange: (LabelLayout) -> Unit,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            "Padrão",
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = if (labelLayout == LabelLayout.STANDARD) FontWeight.SemiBold else FontWeight.Normal,
            ),
            color = if (labelLayout == LabelLayout.STANDARD) OnSurface else OnSurfaceVariant,
        )

        Spacer(Modifier.width(12.dp))

        Switch(
            checked = labelLayout == LabelLayout.COMPACT,
            onCheckedChange = { checked ->
                onCheckedChange(if (checked) LabelLayout.COMPACT else LabelLayout.STANDARD)
            },
            colors = SwitchDefaults.colors(
                checkedThumbColor = Primary,
                checkedTrackColor = Primary.copy(alpha = 0.4f),
                uncheckedThumbColor = OnSurfaceVariant,
                uncheckedTrackColor = OnSurfaceVariant.copy(alpha = 0.2f),
            ),
        )

        Spacer(Modifier.width(12.dp))

        Text(
            "Compacto",
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = if (labelLayout == LabelLayout.COMPACT) FontWeight.SemiBold else FontWeight.Normal,
            ),
            color = if (labelLayout == LabelLayout.COMPACT) OnSurface else OnSurfaceVariant,
        )
    }
}

@Composable
private fun BadgeCanvasWithDimensions(
    displayWidthMm: Double,
    displayHeightMm: Double,
    labelLayout: LabelLayout,
    showQrCode: Boolean,
    showAccessCode: Boolean,
    fontSizeName: Int,
    fontSizeMeta: Int,
    participantName: String,
    company: String?,
    jobTitle: String?,
    eventName: String,
    accessCode: String?,
    qrBitmap: Bitmap?,
) {
    val density = LocalDensity.current.density
    val maxCanvasWidthDp = 280.dp
    val maxCanvasWidthPx = with(LocalDensity.current) { maxCanvasWidthDp.toPx() }

    val aspectRatio = (displayWidthMm / displayHeightMm).toFloat()
    val canvasWidthDp = maxCanvasWidthDp
    val canvasHeightDp = (canvasWidthDp / aspectRatio).coerceAtMost(400.dp)

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.weight(1f),
        ) {
            Canvas(
                modifier = Modifier
                    .width(canvasWidthDp)
                    .height(canvasHeightDp),
            ) {
                val scale = size.width / displayWidthMm.toFloat()
                if (labelLayout == LabelLayout.COMPACT) {
                    drawBadgeContentCompact(
                        scale = scale,
                        displayWidthMm = displayWidthMm,
                        displayHeightMm = displayHeightMm,
                        showQrCode = showQrCode,
                        showAccessCode = showAccessCode,
                        fontSizeName = fontSizeName,
                        fontSizeMeta = fontSizeMeta,
                        participantName = participantName,
                        company = company,
                        jobTitle = jobTitle,
                        eventName = eventName,
                        accessCode = accessCode,
                        qrBitmap = qrBitmap,
                    )
                } else {
                    drawBadgeContent(
                        scale = scale,
                        displayWidthMm = displayWidthMm,
                        displayHeightMm = displayHeightMm,
                        showQrCode = showQrCode,
                        showAccessCode = showAccessCode,
                        fontSizeName = fontSizeName,
                        fontSizeMeta = fontSizeMeta,
                        participantName = participantName,
                        company = company,
                        jobTitle = jobTitle,
                        eventName = eventName,
                        accessCode = accessCode,
                        qrBitmap = qrBitmap,
                    )
                }
            }
        }

        Spacer(Modifier.width(8.dp))

        HeightDimensionIndicator(
            heightMm = displayHeightMm,
            indicatorHeightDp = canvasHeightDp,
            density = density,
        )
    }

    Spacer(Modifier.height(4.dp))

    WidthDimensionIndicator(
        widthMm = displayWidthMm,
        indicatorWidthDp = canvasWidthDp,
        density = density,
    )
}

private fun DrawScope.drawBadgeContent(
    scale: Float,
    displayWidthMm: Double,
    displayHeightMm: Double,
    showQrCode: Boolean,
    showAccessCode: Boolean,
    fontSizeName: Int,
    fontSizeMeta: Int,
    participantName: String,
    company: String?,
    jobTitle: String?,
    eventName: String,
    accessCode: String?,
    qrBitmap: Bitmap?,
) {
    val leftMargin = mmToPx(2.5, scale)
    val topMargin = mmToPx(2.5, scale)
    val labelWidth = size.width
    val labelHeight = size.height
    val contentWidth = labelWidth - leftMargin * 2

    val brandPaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = 6f * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        isAntiAlias = true
    }
    val namePaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = fontSizeName * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        isAntiAlias = true
    }
    val metaPaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = fontSizeMeta * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        isAntiAlias = true
    }
    val tsPaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = 4f * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        isAntiAlias = true
    }
    val codeLabelPaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = 3.5f * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        isAntiAlias = true
    }
    val codeValuePaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = 5f * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        isAntiAlias = true
    }

    val gapTight = mmToPx(0.6, scale)
    val gapBig = mmToPx(2.0, scale)
    val qrMargin = mmToPx(1.0, scale).coerceAtLeast(2f)
    val qrSize = if (showQrCode) {
        mmToPx(MAX_QR_MM, scale).coerceIn(MIN_QR_SIZE_PX.toFloat(), labelWidth * 0.35f)
    } else 0f

    drawRoundRect(
        color = Color.White,
        topLeft = Offset.Zero,
        size = size,
        cornerRadius = CornerRadius(4f, 4f),
    )
    drawRect(
        color = Color(0xFFF8F8FC),
        topLeft = Offset.Zero,
        size = size,
    )

    val canvas = drawContext.canvas.nativeCanvas

    var qrZoneBottom = 0f
    if (showQrCode && qrBitmap != null) {
        val qrX = labelWidth - qrSize - qrMargin
        val qrY = qrMargin
        drawImage(
            image = qrBitmap.asImageBitmap(),
            dstOffset = IntOffset(qrX.toInt(), qrY.toInt()),
            dstSize = IntSize(qrSize.toInt(), qrSize.toInt()),
        )
        qrZoneBottom = qrY + qrSize + gapTight
    }

    val headerW = if (showQrCode) (labelWidth - qrSize - qrMargin - leftMargin) else contentWidth
    val headerText = if (eventName.isNotBlank()) "ONEID - ${eventName.uppercase()}" else "ONEID"

    var y = topMargin
    canvas.drawText(headerText, leftMargin, y + brandPaint.textSize, brandPaint)

    val headerBottom = y + brandPaint.textSize
    y = maxOf(headerBottom, qrZoneBottom) + gapTight

    val maxNameWidth = min(namePaint.measureText(participantName), contentWidth)
    canvas.drawText(participantName, leftMargin, y + namePaint.textSize, namePaint)
    y += namePaint.textSize + gapTight

    if (!jobTitle.isNullOrBlank()) {
        canvas.drawText(jobTitle, leftMargin, y + metaPaint.textSize, metaPaint)
        y += metaPaint.textSize + gapTight
    }

    if (!company.isNullOrBlank()) {
        canvas.drawText(company, leftMargin, y + metaPaint.textSize, metaPaint)
        y += metaPaint.textSize + gapTight
    }

    val sepY = y + gapTight
    val sepStrokeWidth = mmToPx(0.5, scale)
    drawLine(
        color = Color.Black,
        start = Offset(leftMargin, sepY),
        end = Offset(leftMargin + contentWidth, sepY),
        strokeWidth = sepStrokeWidth,
    )
    y = sepY + mmToPx(0.6, scale) + gapTight

    val timestamp = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
    canvas.drawText(timestamp, leftMargin, y + tsPaint.textSize, tsPaint)
    y += tsPaint.textSize + gapTight

    if (showAccessCode && !accessCode.isNullOrBlank()) {
        val label = "Codigo: "
        val labelW = codeLabelPaint.measureText(label)
        canvas.drawText(label, leftMargin, y + codeValuePaint.textSize, codeLabelPaint)
        canvas.drawText(accessCode, leftMargin + labelW, y + codeValuePaint.textSize, codeValuePaint)
    }
}

@Composable
private fun HeightDimensionIndicator(
    heightMm: Double,
    indicatorHeightDp: androidx.compose.ui.unit.Dp,
    density: Float,
) {
    val lineHeightPx = with(LocalDensity.current) { indicatorHeightDp.toPx() }
    val indicatorHeight = indicatorHeightDp.coerceAtLeast(80.dp)

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.height(indicatorHeight).width(24.dp),
    ) {
        IconText(
            text = "${heightMm.toInt()}mm",
            horizontal = false,
            lineLength = indicatorHeightDp * 0.6f,
        )
    }
}

@Composable
private fun WidthDimensionIndicator(
    widthMm: Double,
    indicatorWidthDp: androidx.compose.ui.unit.Dp,
    density: Float,
) {
    val indicatorWidth = indicatorWidthDp.coerceAtMost(280.dp)

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
        modifier = Modifier.width(indicatorWidth).height(20.dp),
    ) {
        IconText(
            text = "${widthMm.toInt()}mm",
            horizontal = true,
            lineLength = indicatorWidthDp * 0.35f,
        )
    }
}

@Composable
private fun IconText(
    text: String,
    horizontal: Boolean,
    lineLength: androidx.compose.ui.unit.Dp,
) {
    val arrowSize = 6.dp

    if (horizontal) {
        ArrowLeft(arrowSize = arrowSize)
        Spacer(Modifier.width(2.dp))
        HorizontalLine(length = lineLength)
        Spacer(Modifier.width(4.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
            ),
            color = OnSurfaceVariant.copy(alpha = 0.7f),
        )
        Spacer(Modifier.width(4.dp))
        HorizontalLine(length = lineLength)
        Spacer(Modifier.width(2.dp))
        ArrowRight(arrowSize = arrowSize)
    } else {
        ArrowUp(arrowSize = arrowSize)
        Spacer(Modifier.height(2.dp))
        VerticalLine(length = lineLength)
        Spacer(Modifier.height(4.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
            ),
            color = OnSurfaceVariant.copy(alpha = 0.7f),
        )
        Spacer(Modifier.height(4.dp))
        VerticalLine(length = lineLength)
        Spacer(Modifier.height(2.dp))
        ArrowDown(arrowSize = arrowSize)
    }
}

@Composable
private fun HorizontalLine(length: androidx.compose.ui.unit.Dp) {
    Canvas(modifier = Modifier.width(length).height(1.dp)) {
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.3f),
            start = Offset.Zero,
            end = Offset(size.width, 0f),
            strokeWidth = 1f,
        )
    }
}

@Composable
private fun VerticalLine(length: androidx.compose.ui.unit.Dp) {
    Canvas(modifier = Modifier.width(1.dp).height(length)) {
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.3f),
            start = Offset.Zero,
            end = Offset(0f, size.height),
            strokeWidth = 1f,
        )
    }
}

@Composable
private fun ArrowLeft(arrowSize: androidx.compose.ui.unit.Dp) {
    Canvas(modifier = Modifier.size(arrowSize)) {
        val h = size.height
        val w = size.width
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w, h / 2),
            end = Offset(0f, h / 2),
            strokeWidth = 1.5f,
        )
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(0f, h / 2),
            end = Offset(w * 0.35f, 0f),
            strokeWidth = 1.5f,
        )
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(0f, h / 2),
            end = Offset(w * 0.35f, h),
            strokeWidth = 1.5f,
        )
    }
}

@Composable
private fun ArrowRight(arrowSize: androidx.compose.ui.unit.Dp) {
    Canvas(modifier = Modifier.size(arrowSize)) {
        val h = size.height
        val w = size.width
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(0f, h / 2),
            end = Offset(w, h / 2),
            strokeWidth = 1.5f,
        )
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w, h / 2),
            end = Offset(w * 0.65f, 0f),
            strokeWidth = 1.5f,
        )
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w, h / 2),
            end = Offset(w * 0.65f, h),
            strokeWidth = 1.5f,
        )
    }
}

@Composable
private fun ArrowUp(arrowSize: androidx.compose.ui.unit.Dp) {
    Canvas(modifier = Modifier.size(arrowSize)) {
        val h = size.height
        val w = size.width
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w / 2, h),
            end = Offset(w / 2, 0f),
            strokeWidth = 1.5f,
        )
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w / 2, 0f),
            end = Offset(0f, h * 0.35f),
            strokeWidth = 1.5f,
        )
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w / 2, 0f),
            end = Offset(w, h * 0.35f),
            strokeWidth = 1.5f,
        )
    }
}

@Composable
private fun ArrowDown(arrowSize: androidx.compose.ui.unit.Dp) {
    Canvas(modifier = Modifier.size(arrowSize)) {
        val h = size.height
        val w = size.width
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w / 2, 0f),
            end = Offset(w / 2, h),
            strokeWidth = 1.5f,
        )
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w / 2, h),
            end = Offset(0f, h * 0.65f),
            strokeWidth = 1.5f,
        )
        drawLine(
            color = OnSurfaceVariant.copy(alpha = 0.6f),
            start = Offset(w / 2, h),
            end = Offset(w, h * 0.65f),
            strokeWidth = 1.5f,
        )
    }
}

private fun DrawScope.drawBadgeContentCompact(
    scale: Float,
    displayWidthMm: Double,
    displayHeightMm: Double,
    showQrCode: Boolean,
    showAccessCode: Boolean,
    fontSizeName: Int,
    fontSizeMeta: Int,
    participantName: String,
    company: String?,
    jobTitle: String?,
    eventName: String,
    accessCode: String?,
    qrBitmap: Bitmap?,
) {
    val leftMargin = mmToPx(2.5, scale)
    val topMargin = mmToPx(2.0, scale)
    val labelWidth = size.width
    val contentWidth = labelWidth - leftMargin * 2

    val brandPaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = 7f * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        isAntiAlias = true
    }
    val namePaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = fontSizeName * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        isAntiAlias = true
    }
    val metaPaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = fontSizeMeta * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        isAntiAlias = true
    }
    val tsPaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = 3.5f * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        isAntiAlias = true
    }
    val codeValuePaint = Paint().apply {
        color = android.graphics.Color.BLACK
        textSize = fontSizeMeta * scale * CSS_SCALE_FACTOR
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        isAntiAlias = true
    }

    val gapTight = mmToPx(0.4, scale)
    val qrMargin = mmToPx(1.0, scale).coerceAtLeast(2f)
    val qrSize = if (showQrCode) {
        mmToPx(MAX_QR_COMPACT_MM, scale).coerceIn(MIN_QR_SIZE_PX.toFloat(), labelWidth * 0.30f)
    } else 0f

    drawRoundRect(
        color = Color.White,
        topLeft = Offset.Zero,
        size = size,
        cornerRadius = CornerRadius(4f, 4f),
    )
    drawRect(
        color = Color(0xFFF8F8FC),
        topLeft = Offset.Zero,
        size = size,
    )

    val canvas = drawContext.canvas.nativeCanvas

    val headerText = if (eventName.isNotBlank()) "ONEID - ${eventName.uppercase()}" else "ONEID"

    var y = topMargin
    canvas.drawText(headerText, leftMargin, y + brandPaint.textSize, brandPaint)
    y += brandPaint.textSize + gapTight * 1.5f

    val textAreaWidth = if (showQrCode) {
        (labelWidth - leftMargin - qrSize - qrMargin - gapTight).toInt()
            .coerceAtLeast(40)
    } else {
        contentWidth.toInt()
    }

    val nameLines = autoWrap(participantName, namePaint, textAreaWidth)
    val nameLinesToDraw = nameLines.take(2)
    for (line in nameLinesToDraw) {
        canvas.drawText(line, leftMargin, y + namePaint.textSize, namePaint)
        y += namePaint.textSize + gapTight
    }

    val hasTitle = !jobTitle.isNullOrBlank()
    val hasCompany = !company.isNullOrBlank()
    if (hasTitle || hasCompany) {
        val metaText = buildString {
            if (hasTitle) append(jobTitle)
            if (hasTitle && hasCompany) append(" – ")
            if (hasCompany) append(company)
        }
        val metaTextClamped = if (metaPaint.measureText(metaText) > textAreaWidth) {
            truncateText(metaText, metaPaint, textAreaWidth)
        } else metaText
        canvas.drawText(metaTextClamped, leftMargin, y + metaPaint.textSize, metaPaint)
        y += metaPaint.textSize + gapTight
    }

    if (showAccessCode && !accessCode.isNullOrBlank()) {
        val codeText = "CÓDIGO: $accessCode"
        canvas.drawText(codeText, leftMargin, y + codeValuePaint.textSize, codeValuePaint)
        y += codeValuePaint.textSize + gapTight
    }

    y += gapTight * 1.5f

    val timestamp = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
    canvas.drawText(timestamp, leftMargin, y + tsPaint.textSize, tsPaint)

    if (showQrCode && qrBitmap != null) {
        val qrX = labelWidth - qrSize - qrMargin
        val qrY = topMargin + brandPaint.textSize + (gapTight * 1.5f).toInt()
        drawImage(
            image = qrBitmap.asImageBitmap(),
            dstOffset = IntOffset(qrX.toInt(), qrY.toInt()),
            dstSize = IntSize(qrSize.toInt(), qrSize.toInt()),
        )
    }
}

private fun mmToPx(mm: Double, scale: Float): Float {
    return (mm.toFloat() * scale).coerceAtLeast(1f)
}

private fun autoWrap(text: String, paint: Paint, maxWidth: Int): List<String> {
    if (paint.measureText(text) <= maxWidth) return listOf(text)
    val lines = mutableListOf<String>()
    val words = text.split(" ")
    val currentLine = StringBuilder()
    for (word in words) {
        val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
        if (paint.measureText(testLine) <= maxWidth) {
            currentLine.append(if (currentLine.isEmpty()) word else " $word")
        } else {
            if (currentLine.isNotEmpty()) lines.add(currentLine.toString())
            currentLine.clear()
            currentLine.append(word)
        }
    }
    if (currentLine.isNotEmpty()) lines.add(currentLine.toString())
    return lines
}

private fun truncateText(text: String, paint: Paint, maxWidth: Int): String {
    if (paint.measureText(text) <= maxWidth) return text
    var result = text
    while (result.isNotEmpty() && paint.measureText(result) > maxWidth) {
        result = result.dropLast(1)
    }
    return result
}

private suspend fun generateQrCodeBitmap(
    value: String,
    sizePx: Int,
): Bitmap? = withContext(Dispatchers.Default) {
    try {
        val writer = QRCodeWriter()
        val bitMatrix = writer.encode(value, BarcodeFormat.QR_CODE, sizePx, sizePx)
        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(android.graphics.Color.WHITE)
        val canvas = Canvas(bitmap)
        val paint = Paint().apply { color = android.graphics.Color.BLACK }
        val moduleW = sizePx.toFloat() / bitMatrix.width
        val moduleH = sizePx.toFloat() / bitMatrix.height
        for (row in 0 until bitMatrix.height) {
            for (col in 0 until bitMatrix.width) {
                if (bitMatrix[col, row]) {
                    canvas.drawRect(
                        col * moduleW, row * moduleH,
                        (col + 1) * moduleW, (row + 1) * moduleH,
                        paint,
                    )
                }
            }
        }
        bitmap
    } catch (_: Exception) {
        null
    }
}
