package com.oneid.totem.data.print

import android.graphics.Bitmap
import android.graphics.Matrix

/**
 * O badge é composto "deitado": largura = comprimento da etiqueta (90mm), altura =
 * largura da fita (29mm). A página da QL, porém, é sempre "em pé" — largura = largura da
 * fita, altura = comprimento. Mandando o bitmap deitado, o FitPageAspect encolhia tudo
 * pra caber nos 29mm de largura e o conteúdo saía minúsculo e virado de lado na pontinha
 * da etiqueta. Girando 90° antes de enviar, o bitmap chega na página já na proporção
 * certa e ocupa a etiqueta inteira, com o texto correndo ao longo do comprimento.
 *
 * Vale pros dois layouts (Compacto e Mínimo), já que ambos são compostos deitados.
 */
internal fun rotateToLabelOrientation(bitmap: Bitmap, orientationPreference: String): Bitmap {
    if (bitmap.width <= bitmap.height) return bitmap

    val matrix = Matrix().apply { postRotate(labelRotationDegrees(orientationPreference)) }

    return try {
        Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    } catch (e: Throwable) {
        bitmap
    }
}

/**
 * A preferência de orientação só escolhe o sentido do giro — é o que permite virar a
 * etiqueta 180° caso ela saia com a leitura no sentido contrário ao desejado. Quem
 * rotaciona é sempre o app, nunca o `printOrientation` do driver (ver [BrotherSdkPrinter]).
 */
internal fun labelRotationDegrees(orientationPreference: String): Float =
    if (orientationPreference == "LANDSCAPE") 270f else 90f
