package com.oneid.totem.presentation.util

/**
 * Máscaras e validações dos campos brasileiros do auto-cadastro. O estado do formulário
 * guarda sempre só os dígitos — a máscara é aplicada na hora de exibir e o que vai pra API
 * é o número limpo, pra não gravar a mesma pessoa com "123.456.789-09" e "12345678909".
 */
object BrazilianFormats {

    const val CPF_DIGITS = 11
    const val PHONE_MIN_DIGITS = 10
    const val PHONE_MAX_DIGITS = 11

    fun onlyDigits(value: String): String = value.filter { it.isDigit() }

    /** Formata progressivamente: 123 -> "123", 1234567890 -> "123.456.789-0". */
    fun formatCpf(digits: String): String {
        val d = onlyDigits(digits).take(CPF_DIGITS)
        return buildString {
            d.forEachIndexed { index, char ->
                when (index) {
                    3, 6 -> append('.')
                    9 -> append('-')
                }
                append(char)
            }
        }
    }

    /** Formata progressivamente: "(11) 99999-8888" com 11 dígitos, "(11) 3333-2222" com 10. */
    fun formatPhone(digits: String): String {
        val d = onlyDigits(digits).take(PHONE_MAX_DIGITS)
        if (d.isEmpty()) return ""

        val separatorIndex = if (d.length > PHONE_MIN_DIGITS) 7 else 6
        return buildString {
            d.forEachIndexed { index, char ->
                when (index) {
                    0 -> append('(')
                    2 -> append(") ")
                    separatorIndex -> append('-')
                }
                append(char)
            }
        }
    }

    /**
     * Valida o CPF pelos dois dígitos verificadores. Sequências repetidas (000.000.000-00,
     * 111.111.111-11 ...) passam no cálculo mas não são CPFs reais, então são rejeitadas
     * explicitamente — são justamente o que alguém digita pra "furar" o campo.
     */
    fun isValidCpf(value: String): Boolean {
        val d = onlyDigits(value)
        if (d.length != CPF_DIGITS) return false
        if (d.all { it == d[0] }) return false

        val digits = d.map { it - '0' }

        for (checkDigitIndex in 9..10) {
            var sum = 0
            for (i in 0 until checkDigitIndex) {
                sum += digits[i] * (checkDigitIndex + 1 - i)
            }
            val remainder = sum % 11
            val expected = if (remainder < 2) 0 else 11 - remainder
            if (digits[checkDigitIndex] != expected) return false
        }

        return true
    }

    fun isValidPhone(value: String): Boolean {
        val d = onlyDigits(value)
        return d.length in PHONE_MIN_DIGITS..PHONE_MAX_DIGITS
    }

    /**
     * Checagem de e-mail deliberadamente frouxa: o totem está numa fila de evento e o
     * objetivo é pegar erro de digitação óbvio, não reprovar endereço válido e exótico.
     * Quem valida de verdade é a API.
     */
    fun isValidEmail(value: String): Boolean {
        val email = value.trim()
        if (email.length < 5 || email.any { it.isWhitespace() }) return false
        val at = email.indexOf('@')
        if (at <= 0 || at != email.lastIndexOf('@')) return false
        val domain = email.substring(at + 1)
        return domain.length >= 3 && domain.contains('.') &&
            !domain.startsWith('.') && !domain.endsWith('.')
    }
}
