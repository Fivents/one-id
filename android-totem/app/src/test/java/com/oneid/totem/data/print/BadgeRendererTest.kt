package com.oneid.totem.data.print

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
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
        assertEquals(732, bitmap.width)
        assertEquals(590, bitmap.height)
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
        assertEquals(732, bitmap.width)
        assertEquals(354, bitmap.height)
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
}
