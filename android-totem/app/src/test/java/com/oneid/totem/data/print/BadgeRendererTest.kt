package com.oneid.totem.data.print

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Typeface
import com.oneid.totem.domain.repository.LabelLayout
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class BadgeRendererTest {

    private val renderer = BadgeRenderer()
    private val textRenderer = TestBadgerRenderer()

    private class TestBadgerRenderer : BadgeRenderer() {
        override fun textWidth(paint: android.graphics.Paint, text: String): Float =
            text.length * paint.textSize * 0.5f
    }

    @Test
    fun `mmToPixels converts correctly`() {
        assertEquals(118, BadgeRenderer.mmToPixels(10.0, 300))
        assertEquals(236, BadgeRenderer.mmToPixels(20.0, 300))
        assertEquals(354, BadgeRenderer.mmToPixels(30.0, 300))
        assertEquals(1, BadgeRenderer.mmToPixels(0.05, 300))
    }

    @Test
    fun `mmToPixels handles zero`() {
        assertEquals(1, BadgeRenderer.mmToPixels(0.0, 300))
    }

    @Test
    fun `renderFromData creates bitmap with correct dimensions`() = runTest {
        val bitmap = renderer.renderFromData(
            name = "João Silva",
            company = "ACME Corp",
            jobTitle = "Engenheiro",
            qrCodeValue = "https://example.com/qr",
            accessCode = "ABC123",
            paperWidthMm = 62.0,
            paperHeightMm = 50.0,
            dpi = 300,
        )

        assertNotNull(bitmap)
        assertEquals(BadgeRenderer.mmToPixels(50.0, 300), bitmap.width)
        assertTrue(bitmap.height in 1..BadgeRenderer.mmToPixels(62.0, 300))
    }

    @Test
    fun `renderFromData handles null fields`() = runTest {
        val bitmap = renderer.renderFromData(
            name = "Maria Souza",
            company = null,
            jobTitle = null,
            qrCodeValue = null,
            accessCode = null,
            paperWidthMm = 62.0,
            paperHeightMm = 30.0,
            dpi = 300,
        )

        assertNotNull(bitmap)
        assertEquals(BadgeRenderer.mmToPixels(30.0, 300), bitmap.width)
        assertTrue(bitmap.height in 1..BadgeRenderer.mmToPixels(62.0, 300))
    }

    @Test
    fun `renderFromData MINIMAL_QR creates 29mm wide bitmap`() = runTest {
        val bitmap = renderer.renderFromData(
            name = "MARIA EDUARDA SILVA SANTOS DE OLIVEIRA",
            company = "EMPRESA EXEMPLO DE TECNOLOGIA E SERVIÇOS LTDA",
            jobTitle = "DIRETORA DE MARKETING E VENDAS",
            qrCodeValue = "teste-print-001",
            accessCode = null,
            paperWidthMm = 62.0,
            paperHeightMm = 50.0,
            dpi = 300,
            labelLayout = LabelLayout.MINIMAL_QR,
        )

        assertNotNull(bitmap)
        assertEquals(BadgeRenderer.mmToPixels(29.0, 300), bitmap.width)
        assertTrue(bitmap.height in 1..BadgeRenderer.mmToPixels(120.0, 300))
    }

    @Test
    fun `render parses HTML with all fields`() = runTest {
        val html = """
            <div id="participantName">Carlos Santos</div>
            <div class="jobTitle">Analista</div>
            <div class="company">Tech Ltda</div>
            <div class="accessCode">XYZ789</div>
            <div class="qrcode">value123</div>
        """.trimIndent()

        val bitmap = renderer.render(
            html = html,
            paperWidthMm = 62.0,
            paperHeightMm = 50.0,
            dpi = 300,
        )

        assertNotNull(bitmap)
        assertEquals(732, bitmap.width)
        assertEquals(590, bitmap.height)
    }

    @Test
    fun `render parses HTML with only name`() = runTest {
        val html = """<span id="participantName">Ana Paula</span>"""

        val bitmap = renderer.render(
            html = html,
            paperWidthMm = 62.0,
            paperHeightMm = 20.0,
            dpi = 300,
        )

        assertNotNull(bitmap)
        assertEquals(732, bitmap.width)
    }

    @Test
    fun `render handles empty HTML`() = runTest {
        val bitmap = renderer.render(
            html = "",
            paperWidthMm = 62.0,
            paperHeightMm = 50.0,
            dpi = 300,
        )

        assertNotNull(bitmap)
        assertEquals(732, bitmap.width)
    }

    @Test
    fun `mmToPixels coerceAtLeast ensures minimum 1 pixel`() {
        assertEquals(1, BadgeRenderer.mmToPixels(0.001, 300))
    }

    @Test
    fun `MINIMAL_QR has identical QR bounding box for short and long payloads`() = runTest {
        val short = renderMinimalQr("TOKEN-123")
        val long = renderMinimalQr("https://example.com/checkin?token=" + "A".repeat(167))

        assertNotNull(short)
        assertNotNull(long)
        assertArrayEquals("QR square should have the same black bounds for any payload", blackBounds(short), blackBounds(long))
        assertTrue("QR should have rendered black pixels", blackBounds(short)[0] != Int.MAX_VALUE)
    }

    @Test
    fun `MINIMAL_QR falls back to automatic version when payload exceeds v10 capacity`() = runTest {
        val bitmap = renderMinimalQr("https://example.com/checkin?token=" + "A".repeat(500))

        assertNotNull(bitmap)
        assertEquals(BadgeRenderer.mmToPixels(29.0, 300), bitmap.width)
        assertTrue(bitmap.height in 1..BadgeRenderer.mmToPixels(120.0, 300))
        assertTrue("QR should still render after fallback", blackBounds(bitmap)[0] != Int.MAX_VALUE)
    }

    @Test
    fun `MINIMAL_QR black QR is flush to the label edges`() = runTest {
        val bitmap = renderMinimalQr("TOKEN-123")

        assertNotNull(bitmap)
        val bounds = qrBounds(bitmap)
        val maxInsetPx = BadgeRenderer.mmToPixels(0.3, 300)
        assertTrue("QR should touch the top edge (top=${bounds[0]})", bounds[0] <= maxInsetPx)
        assertTrue("QR should touch the left edge (left=${bounds[2]})", bounds[2] <= maxInsetPx)
        assertTrue(
            "QR should touch the right edge (right=${bounds[3]} of ${bitmap.width})",
            bounds[3] >= bitmap.width - 1 - maxInsetPx,
        )
    }

    @Test
    fun `MINIMAL_QR QR bounds identical with and without company and job title`() = runTest {
        val withMeta = renderMinimalQr("TOKEN-123")
        val nameOnly = renderMinimalQr(
            qrCodeValue = "TOKEN-123",
            name = "MARIA EDUARDA SILVA SANTOS DE OLIVEIRA",
            company = null,
            jobTitle = null,
        )

        assertNotNull(withMeta)
        assertNotNull(nameOnly)
        assertArrayEquals(
            "QR square should be the same with or without meta text",
            qrBounds(withMeta),
            qrBounds(nameOnly),
        )
    }

    @Test
    fun `COMPACT creates 29mm wide bitmap sized to the actual content, not the full 150mm canvas`() = runTest {
        val bitmap = renderCompactQr(name = "JOÃO DA SILVA SOUZA")

        assertNotNull(bitmap)
        assertEquals(BadgeRenderer.mmToPixels(29.0, 300), bitmap.width)
        assertTrue(
            "feed should be tightly cropped to content, well under the 150mm ceiling (height=${bitmap.height}px)",
            bitmap.height < BadgeRenderer.mmToPixels(150.0, 300),
        )
        assertTrue("feed should still be positive", bitmap.height > 0)
    }

    @Test
    fun `COMPACT feed length grows with the widest content line`() = runTest {
        val short = renderCompactQr(name = "ANA", company = null, jobTitle = null)
        val long = renderCompactQr(name = "ANA", company = "A".repeat(80), jobTitle = null)

        assertNotNull(short)
        assertNotNull(long)
        assertTrue(
            "a much wider company line should require a longer feed (short=${short.height}px, long=${long.height}px)",
            long.height > short.height,
        )
        assertTrue("feed should never exceed the 150mm ceiling", long.height <= BadgeRenderer.mmToPixels(150.0, 300))
    }

    @Test
    fun `COMPACT lets company text use the space a wide name already reserves`() = runTest {
        // A wide name reserves horizontal space regardless of the meta text. Company/job
        // should be allowed to use that same space (plus a bit of extra growth) instead of
        // being cut off at a small fixed width, which would leave a big gap before the QR.
        val wideName = "CONSTANTINOPOLISVILA ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLM"
        val longCompany = "A".repeat(80)

        val withWideName = renderCompactQr(name = wideName, company = longCompany, jobTitle = null)
        val withShortName = renderCompactQr(name = "ANA", company = longCompany, jobTitle = null)

        assertNotNull(withWideName)
        assertNotNull(withShortName)
        assertTrue(
            "company text should stretch further when the name already reserved more space " +
                "(wideName label=${withWideName.height}px, shortName label=${withShortName.height}px)",
            withWideName.height > withShortName.height,
        )
    }

    @Test
    fun `COMPACT never exceeds the 150mm feed ceiling for a pathological single word name`() = runTest {
        val bitmap = renderCompactQr(name = "A".repeat(150))

        assertNotNull(bitmap)
        assertTrue(
            "feed should never exceed the 150mm ceiling (height=${bitmap.height}px)",
            bitmap.height <= BadgeRenderer.mmToPixels(150.0, 300),
        )
        assertTrue("name should still render black pixels after truncation", blackBounds(bitmap)[0] != Int.MAX_VALUE)
    }

    @Test
    fun `COMPACT name normalization uses first and last name only`() = runTest {
        val full = renderCompactQr(name = "MARIA FERNANDA OLIVEIRA COSTA")
        val shortened = renderCompactQr(name = "MARIA COSTA")

        assertNotNull(full)
        assertNotNull(shortened)
        assertEquals("normalized name should render the same label height", full.height, shortened.height)
        assertArrayEquals(
            "normalized name should render the same black content",
            blackBounds(full),
            blackBounds(shortened),
        )
    }

    @Test
    fun `COMPACT QR size stays the same with or without company and job title`() = runTest {
        // The label now shrinks to fit its content, so adding meta text can change the
        // label's total length (and therefore the QR's absolute position) — but the QR's
        // own size only depends on the name row height, and it always stays flush against
        // the end of whatever length the label ends up being.
        val name = "MARIA EDUARDA SILVA SANTOS DE OLIVEIRA"
        val withMeta = renderCompactQr(name = name)
        val nameOnly = renderCompactQr(
            name = name,
            company = null,
            jobTitle = null,
        )

        assertNotNull(withMeta)
        assertNotNull(nameOnly)
        val boundsWithMeta = compactQrBounds(withMeta, name)
        val boundsNameOnly = compactQrBounds(nameOnly, name)
        val expectedQrSize = compactQrSize(name)
        val tolerance = BadgeRenderer.mmToPixels(3.0, 300)

        assertEquals(
            "QR square should be the same size regardless of meta text",
            boundsNameOnly[1] - boundsNameOnly[0],
            boundsWithMeta[1] - boundsWithMeta[0],
        )
        assertTrue(
            "QR should stay flush against the end of the label even with meta text",
            boundsWithMeta[0] >= withMeta.height - expectedQrSize - tolerance,
        )
        assertTrue(
            "QR should stay flush against the end of the label without meta text",
            boundsNameOnly[0] >= nameOnly.height - expectedQrSize - tolerance,
        )
    }

    @Test
    fun `COMPACT QR sits at the feed end and reaches the label edges`() = runTest {
        val name = "MARIA EDUARDA SILVA SANTOS DE OLIVEIRA"
        val bitmap = renderCompactQr(name = name)

        assertNotNull(bitmap)
        val bounds = compactQrBounds(bitmap, name)
        val dpi = 300
        val marginPx = BadgeRenderer.mmToPixels(BadgeRenderer.COMPACT_MARGIN_MM, dpi)
        val qrSize = compactQrSize(name)
        val tolerance = BadgeRenderer.mmToPixels(3.0, dpi)

        assertTrue(
            "QR should be large, filling the band below the name (black height=${bounds[3] - bounds[2]}px)",
            bounds[3] - bounds[2] >= BadgeRenderer.mmToPixels(11.0, dpi),
        )
        assertTrue(
            "QR should touch the label top edge (margin 0) (left=${bounds[2]}px)",
            bounds[2] <= marginPx + tolerance,
        )
        assertTrue(
            "QR should sit at the feed end, out of the text strip (top=${bounds[0]}px of ${bitmap.height})",
            bounds[0] >= bitmap.height - marginPx - qrSize - tolerance,
        )
        assertTrue("QR should have rendered black pixels", bounds[0] != Int.MAX_VALUE)
    }

    @Test
    fun `COMPACT QR keeps the same outer size regardless of payload length`() = runTest {
        // The physical QR square is always the qrSize computed from the name row height —
        // ZXing just packs more/smaller modules into that same square for longer payloads,
        // it never grows or shrinks the outer square itself.
        val name = "MARIA EDUARDA SILVA SANTOS DE OLIVEIRA"
        val short = renderCompactQr(name = name, qrCodeValue = "TOKEN-123")
        val long = renderCompactQr(
            name = name,
            qrCodeValue = "https://example.com/checkin?token=" + "A".repeat(150),
        )

        assertNotNull(short)
        assertNotNull(long)
        assertEquals("label width should not depend on QR payload length", short.width, long.width)
        assertEquals("label height should not depend on QR payload length", short.height, long.height)
        assertArrayEquals(
            "QR square outer bounds should be identical for any payload",
            compactQrBounds(short, name),
            compactQrBounds(long, name),
        )
    }

    private suspend fun renderCompactQr(
        name: String,
        company: String? = "EMPRESA EXEMPLO DE TECNOLOGIA E SERVIÇOS LTDA",
        jobTitle: String? = "DIRETORA DE MARKETING E VENDAS",
        qrCodeValue: String = "TOKEN-123",
    ): Bitmap = textRenderer.renderFromData(
        name = name,
        company = company,
        jobTitle = jobTitle,
        qrCodeValue = qrCodeValue,
        accessCode = null,
        paperWidthMm = 62.0,
        paperHeightMm = 50.0,
        dpi = 300,
        labelLayout = LabelLayout.COMPACT,
    )

    /** Mirrors BadgeRenderer's private shortenName(): keeps only first + last name. */
    private fun shortenNameForTest(fullName: String): String {
        val parts = fullName.trim().split("\\s+".toRegex())
        if (parts.size <= 2) return fullName
        return "${parts.first()} ${parts.last()}"
    }

    /**
     * QR size now depends on how tall the name row is (the QR fills whatever height remains
     * below the name), so this mirrors BadgeRenderer's renderCompactQr calculation exactly,
     * using real font metrics (getTextBounds isn't stubbed by TestBadgerRenderer).
     */
    private fun compactQrSize(name: String): Int {
        val dpi = 300
        val marginPx = BadgeRenderer.mmToPixels(BadgeRenderer.COMPACT_MARGIN_MM, dpi)
        val logicalH = BadgeRenderer.mmToPixels(BadgeRenderer.MINIMAL_QR_ROLL_WIDTH_MM, dpi)
        val cssScale = dpi / 96f * 2.2f
        val namePaint = Paint().apply {
            textSize = BadgeRenderer.COMPACT_NAME_FONT_CSS * cssScale
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
        }
        val nameText = shortenNameForTest(name).uppercase()
        val nameRect = Rect()
        namePaint.getTextBounds(nameText, 0, nameText.length, nameRect)
        val nameBaseline = -nameRect.top.toFloat()
        val nameBlockBottom = nameBaseline + nameRect.bottom.toFloat()
        val nameToQrGapPx = BadgeRenderer.mmToPixels(BadgeRenderer.COMPACT_NAME_TO_QR_GAP_MM, dpi)
        val qrSizeRaw = (logicalH - marginPx - nameBlockBottom - nameToQrGapPx).toInt()
        return qrSizeRaw.coerceIn(
            BadgeRenderer.mmToPixels(BadgeRenderer.COMPACT_QR_MIN_MM, dpi),
            BadgeRenderer.mmToPixels(BadgeRenderer.COMPACT_QR_MAX_MM, dpi),
        )
    }

    private fun compactQrBounds(bitmap: Bitmap, name: String): IntArray {
        val marginPx = BadgeRenderer.mmToPixels(BadgeRenderer.COMPACT_MARGIN_MM, 300)
        val qrSize = compactQrSize(name)
        val startY = (bitmap.height - marginPx - qrSize).coerceAtLeast(0)
        var top = Int.MAX_VALUE
        var bottom = -1
        var left = Int.MAX_VALUE
        var right = -1
        for (y in startY until bitmap.height) {
            for (x in 0 until bitmap.width) {
                if (Color.alpha(bitmap.getPixel(x, y)) != 0) {
                    if (y < top) top = y
                    if (y > bottom) bottom = y
                    if (x < left) left = x
                    if (x > right) right = x
                }
            }
        }
        return intArrayOf(top, bottom, left, right)
    }

    private suspend fun renderMinimalQr(
        qrCodeValue: String,
        name: String = "MARIA EDUARDA SILVA SANTOS DE OLIVEIRA",
        company: String? = "EMPRESA EXEMPLO DE TECNOLOGIA E SERVIÇOS LTDA",
        jobTitle: String? = "DIRETORA DE MARKETING E VENDAS",
    ): Bitmap = renderer.renderFromData(
        name = name,
        company = company,
        jobTitle = jobTitle,
        qrCodeValue = qrCodeValue,
        accessCode = null,
        paperWidthMm = 62.0,
        paperHeightMm = 50.0,
        dpi = 300,
        labelLayout = LabelLayout.MINIMAL_QR,
    )

    private fun blackBounds(bitmap: Bitmap): IntArray {
        var top = Int.MAX_VALUE
        var bottom = -1
        var left = Int.MAX_VALUE
        var right = -1
        for (y in 0 until bitmap.height) {
            for (x in 0 until bitmap.width) {
                if (Color.alpha(bitmap.getPixel(x, y)) != 0) {
                    if (y < top) top = y
                    if (y > bottom) bottom = y
                    if (x < left) left = x
                    if (x > right) right = x
                }
            }
        }
        return intArrayOf(top, bottom, left, right)
    }

    private fun qrBounds(bitmap: Bitmap): IntArray {
        val qrAreaHeight = BadgeRenderer.mmToPixels(BadgeRenderer.MINIMAL_QR_ROLL_WIDTH_MM, 300)
        var top = Int.MAX_VALUE
        var bottom = -1
        var left = Int.MAX_VALUE
        var right = -1
        val maxY = minOf(bitmap.height, qrAreaHeight)
        for (y in 0 until maxY) {
            for (x in 0 until bitmap.width) {
                if (Color.alpha(bitmap.getPixel(x, y)) != 0) {
                    if (y < top) top = y
                    if (y > bottom) bottom = y
                    if (x < left) left = x
                    if (x > right) right = x
                }
            }
        }
        return intArrayOf(top, bottom, left, right)
    }
}
