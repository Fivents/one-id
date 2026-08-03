package com.oneid.totem.data.print

import android.graphics.Bitmap
import android.graphics.Color
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
            bounds[3] >= bitmap.width - maxInsetPx,
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
                if (bitmap.getPixel(x, y) != Color.WHITE) {
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
                if (bitmap.getPixel(x, y) != Color.WHITE) {
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
