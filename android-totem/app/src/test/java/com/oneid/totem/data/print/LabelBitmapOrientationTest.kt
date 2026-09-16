package com.oneid.totem.data.print

import android.graphics.Bitmap
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LabelBitmapOrientationTest {

    private fun landscapeBadge(): Bitmap = Bitmap.createBitmap(
        BadgeRenderer.mmToPixels(BadgeRenderer.LABEL_LENGTH_MM, 300),
        BadgeRenderer.mmToPixels(BadgeRenderer.MINIMAL_QR_ROLL_WIDTH_MM, 300),
        Bitmap.Config.ARGB_8888,
    )

    @Test
    fun `badge deitado vira em pe para casar com a pagina da etiqueta`() {
        val source = landscapeBadge()

        val rotated = rotateToLabelOrientation(source, "PORTRAIT")

        // Largura do bitmap tem que virar a largura da fita (29mm) e a altura o
        // comprimento (90mm) — é isso que faz o conteúdo ocupar a etiqueta inteira em
        // vez de ser encolhido pelo FitPageAspect até caber na largura da fita.
        assertEquals(source.height, rotated.width)
        assertEquals(source.width, rotated.height)
    }

    @Test
    fun `orientacao LANDSCAPE gira para o lado oposto`() {
        assertEquals(90f, labelRotationDegrees("PORTRAIT"))
        assertEquals(270f, labelRotationDegrees("LANDSCAPE"))
    }

    @Test
    fun `bitmap que ja esta em pe nao e girado`() {
        val alreadyPortrait = Bitmap.createBitmap(342, 1062, Bitmap.Config.ARGB_8888)

        assertSame(alreadyPortrait, rotateToLabelOrientation(alreadyPortrait, "PORTRAIT"))
    }
}
