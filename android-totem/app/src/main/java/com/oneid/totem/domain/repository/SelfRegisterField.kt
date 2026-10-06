package com.oneid.totem.domain.repository

/**
 * Campos opcionais da tela de auto-cadastro que o operador pode ligar ou desligar em cada
 * totem. Nome e e-mail ficam de fora porque são sempre exibidos e obrigatórios.
 */
enum class SelfRegisterField { DOCUMENT, PHONE, COMPANY, JOB_TITLE }
