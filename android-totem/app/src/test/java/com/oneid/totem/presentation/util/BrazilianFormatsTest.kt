package com.oneid.totem.presentation.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BrazilianFormatsTest {

    @Test
    fun `cpf mask is applied progressively while typing`() {
        assertEquals("", BrazilianFormats.formatCpf(""))
        assertEquals("123", BrazilianFormats.formatCpf("123"))
        assertEquals("123.456", BrazilianFormats.formatCpf("123456"))
        assertEquals("123.456.789", BrazilianFormats.formatCpf("123456789"))
        assertEquals("123.456.789-09", BrazilianFormats.formatCpf("12345678909"))
    }

    @Test
    fun `cpf mask ignores extra digits and characters already typed`() {
        // O campo devolve o texto já mascarado, então a máscara precisa ser idempotente.
        assertEquals("123.456.789-09", BrazilianFormats.formatCpf("123.456.789-09"))
        assertEquals("123.456.789-09", BrazilianFormats.formatCpf("1234567890999"))
    }

    @Test
    fun `valid cpf passes the check digits`() {
        assertTrue(BrazilianFormats.isValidCpf("529.982.247-25"))
        assertTrue(BrazilianFormats.isValidCpf("52998224725"))
    }

    @Test
    fun `cpf with wrong check digits is rejected`() {
        assertFalse(BrazilianFormats.isValidCpf("529.982.247-26"))
        assertFalse(BrazilianFormats.isValidCpf("12345678900"))
    }

    @Test
    fun `cpf with repeated digits is rejected even though the math checks out`() {
        assertFalse(BrazilianFormats.isValidCpf("111.111.111-11"))
        assertFalse(BrazilianFormats.isValidCpf("00000000000"))
    }

    @Test
    fun `incomplete cpf is rejected`() {
        assertFalse(BrazilianFormats.isValidCpf("5299822472"))
        assertFalse(BrazilianFormats.isValidCpf(""))
    }

    @Test
    fun `phone mask handles both mobile and landline lengths`() {
        assertEquals("(11) 3333-2222", BrazilianFormats.formatPhone("1133332222"))
        assertEquals("(11) 99999-8888", BrazilianFormats.formatPhone("11999998888"))
        assertEquals("(11) 9", BrazilianFormats.formatPhone("119"))
    }

    @Test
    fun `phone needs ten or eleven digits`() {
        assertTrue(BrazilianFormats.isValidPhone("(11) 3333-2222"))
        assertTrue(BrazilianFormats.isValidPhone("11999998888"))
        assertFalse(BrazilianFormats.isValidPhone("119999988"))
        assertFalse(BrazilianFormats.isValidPhone("119999988887"))
    }

    @Test
    fun `email check catches the common typos`() {
        assertTrue(BrazilianFormats.isValidEmail("maria@empresa.com.br"))
        assertFalse(BrazilianFormats.isValidEmail("maria"))
        assertFalse(BrazilianFormats.isValidEmail("maria@empresa"))
        assertFalse(BrazilianFormats.isValidEmail("maria@@empresa.com"))
        assertFalse(BrazilianFormats.isValidEmail("maria @empresa.com"))
        assertFalse(BrazilianFormats.isValidEmail("@empresa.com"))
    }
}
