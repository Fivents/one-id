package com.oneid.totem.presentation.util

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation

/**
 * Aplica a máscara só na exibição, mantendo o valor do campo como dígitos puros.
 *
 * Mascarar o próprio `value` do campo (formatar no state e devolver o texto já pontuado)
 * é o que fazia o cursor pular: pra cada tecla o texto mudava de tamanho e o Compose,
 * sem saber pra onde o caractere digitado foi parar, jogava o cursor pro fim — digitar no
 * meio do CPF era impossível. Como `VisualTransformation`, o texto editado continua sendo
 * "52998224725" e o [OffsetMapping] traduz a posição do cursor entre os dois mundos, então
 * a seleção acompanha a digitação naturalmente.
 */
class DigitMaskTransformation(
    private val maxDigits: Int,
    private val format: (String) -> String,
) : VisualTransformation {

    override fun filter(text: AnnotatedString): TransformedText {
        val digits = text.text.filter { it.isDigit() }.take(maxDigits)
        val masked = format(digits)
        return TransformedText(
            AnnotatedString(masked),
            DigitOffsetMapping(masked = masked, digitCount = digits.length),
        )
    }
}

/**
 * Converte posições entre o texto cru (só dígitos) e o texto mascarado contando dígitos,
 * em vez de somar deslocamentos fixos por faixa. Isso é o que faz a máscara do telefone
 * funcionar: o hífen muda de lugar entre fixo (10 dígitos) e celular (11), e uma tabela de
 * offsets fixa erraria justamente na transição.
 */
private class DigitOffsetMapping(
    private val masked: String,
    private val digitCount: Int,
) : OffsetMapping {

    /** Posição logo depois do n-ésimo dígito no texto mascarado. */
    override fun originalToTransformed(offset: Int): Int {
        val target = offset.coerceIn(0, digitCount)
        if (target == 0) return 0

        var seen = 0
        masked.forEachIndexed { index, char ->
            if (char.isDigit()) {
                seen++
                if (seen == target) return index + 1
            }
        }
        return masked.length
    }

    /** Quantos dígitos existem antes dessa posição do texto mascarado. */
    override fun transformedToOriginal(offset: Int): Int {
        val end = offset.coerceIn(0, masked.length)
        return masked.take(end).count { it.isDigit() }
    }
}

val CpfVisualTransformation = DigitMaskTransformation(
    maxDigits = BrazilianFormats.CPF_DIGITS,
    format = BrazilianFormats::formatCpf,
)

val PhoneVisualTransformation = DigitMaskTransformation(
    maxDigits = BrazilianFormats.PHONE_MAX_DIGITS,
    format = BrazilianFormats::formatPhone,
)
