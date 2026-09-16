package com.oneid.totem.presentation.util

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.TransformedText
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DigitMaskTransformationTest {

    private fun cpf(digits: String): TransformedText =
        CpfVisualTransformation.filter(AnnotatedString(digits))

    private fun phone(digits: String): TransformedText =
        PhoneVisualTransformation.filter(AnnotatedString(digits))

    @Test
    fun `cpf is rendered masked while the edited text stays raw`() {
        assertEquals("529.982.247-25", cpf("52998224725").text.text)
        assertEquals("529.98", cpf("52998").text.text)
    }

    @Test
    fun `cursor at the end of the cpf lands at the end of the mask`() {
        // É o caso de toda digitação normal: o cursor tem que acompanhar o último dígito
        // em vez de voltar pro começo ou travar antes da pontuação.
        for (length in 0..11) {
            val digits = "52998224725".take(length)
            val transformed = cpf(digits)
            assertEquals(
                "cursor no fim de $length dígito(s)",
                transformed.text.text.length,
                transformed.offsetMapping.originalToTransformed(length),
            )
        }
    }

    @Test
    fun `cursor in the middle of the cpf skips over the separators`() {
        val transformed = cpf("52998224725") // "529.982.247-25"
        val mapping = transformed.offsetMapping

        assertEquals(3, mapping.originalToTransformed(3))   // 529|.982...
        assertEquals(7, mapping.originalToTransformed(6))   // 529.982|.247...
        assertEquals(11, mapping.originalToTransformed(9))  // 529.982.247|-25
        assertEquals(13, mapping.originalToTransformed(10)) // 529.982.247-2|5
    }

    @Test
    fun `cpf mapping round-trips in both directions`() {
        val transformed = cpf("52998224725")
        val mapping = transformed.offsetMapping

        for (offset in 0..11) {
            assertEquals(
                "ida e volta do offset $offset",
                offset,
                mapping.transformedToOriginal(mapping.originalToTransformed(offset)),
            )
        }
    }

    @Test
    fun `phone mask moves the hyphen between landline and mobile`() {
        assertEquals("(11) 3333-2222", phone("1133332222").text.text)
        assertEquals("(11) 99999-8888", phone("11999998888").text.text)
    }

    @Test
    fun `phone cursor follows the hyphen when the tenth digit turns it into a mobile`() {
        // A transição de 10 para 11 dígitos empurra o hífen uma casa. Um mapeamento por
        // faixas fixas erraria exatamente aqui; contando dígitos, não.
        val landline = phone("1133332222")
        assertEquals(9, landline.offsetMapping.originalToTransformed(6))
        assertEquals(14, landline.offsetMapping.originalToTransformed(10))

        val mobile = phone("11999998888")
        assertEquals(9, mobile.offsetMapping.originalToTransformed(6))
        assertEquals(10, mobile.offsetMapping.originalToTransformed(7))
        assertEquals(15, mobile.offsetMapping.originalToTransformed(11))
    }

    @Test
    fun `phone mapping round-trips in both directions`() {
        for (digits in listOf("", "1", "11", "119", "1133332222", "11999998888")) {
            val mapping = phone(digits).offsetMapping
            for (offset in 0..digits.length) {
                assertEquals(
                    "ida e volta de \"$digits\" no offset $offset",
                    offset,
                    mapping.transformedToOriginal(mapping.originalToTransformed(offset)),
                )
            }
        }
    }

    @Test
    fun `offsets stay inside the transformed text for every prefix`() {
        // O Compose lança IllegalStateException se o mapeamento devolver uma posição fora
        // do texto — o que derrubaria a tela de cadastro no meio da digitação.
        for (length in 0..11) {
            val digits = "11999998888".take(length)
            val transformed = phone(digits)
            for (offset in 0..length) {
                val mapped = transformed.offsetMapping.originalToTransformed(offset)
                assertTrue(
                    "offset $offset de $length dígito(s) saiu do texto",
                    mapped in 0..transformed.text.text.length,
                )
            }
        }
    }
}
