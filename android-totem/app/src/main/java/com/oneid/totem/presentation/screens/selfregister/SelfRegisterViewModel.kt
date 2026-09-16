package com.oneid.totem.presentation.screens.selfregister

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.domain.model.SelfRegistration
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.SelfRegisterResult
import com.oneid.totem.presentation.util.BrazilianFormats
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SelfRegisterUiState(
    // Documento e telefone ficam só com os dígitos; a máscara é aplicada na exibição.
    val name: String = "",
    val email: String = "",
    val document: String = "",
    val phone: String = "",
    val company: String = "",
    val jobTitle: String = "",
    val nameError: String? = null,
    val emailError: String? = null,
    val documentError: String? = null,
    val phoneError: String? = null,
    val autoCheckIn: Boolean = true,
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: SelfRegistration? = null,
)

@HiltViewModel
class SelfRegisterViewModel @Inject constructor(
    private val checkInRepository: CheckInRepository,
    private val printerConfigRepository: PrinterConfigRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        SelfRegisterUiState(autoCheckIn = printerConfigRepository.selfRegisterAutoCheckInValue),
    )
    val uiState = _uiState.asStateFlow()

    fun onNameChanged(name: String) {
        _uiState.update { it.copy(name = name, nameError = null, error = null) }
    }

    fun onEmailChanged(email: String) {
        _uiState.update { it.copy(email = email, emailError = null, error = null) }
    }

    fun onDocumentChanged(document: String) {
        val digits = BrazilianFormats.onlyDigits(document).take(BrazilianFormats.CPF_DIGITS)
        _uiState.update { it.copy(document = digits, documentError = null, error = null) }
    }

    fun onPhoneChanged(phone: String) {
        val digits = BrazilianFormats.onlyDigits(phone).take(BrazilianFormats.PHONE_MAX_DIGITS)
        _uiState.update { it.copy(phone = digits, phoneError = null, error = null) }
    }

    fun onCompanyChanged(company: String) {
        _uiState.update { it.copy(company = company, error = null) }
    }

    fun onJobTitleChanged(jobTitle: String) {
        _uiState.update { it.copy(jobTitle = jobTitle, error = null) }
    }

    fun submit() {
        val state = _uiState.value
        if (state.isLoading) return

        // Só nome e e-mail são obrigatórios. CPF e telefone valem a validação quando
        // preenchidos: um dado errado no cadastro vira trabalho manual depois, e aqui a
        // pessoa ainda está na frente do totem pra corrigir.
        val nameError = if (state.name.trim().length < 2) "Informe seu nome completo" else null
        val emailError = when {
            state.email.isBlank() -> "Informe seu e-mail"
            !BrazilianFormats.isValidEmail(state.email) -> "E-mail inválido"
            else -> null
        }
        val documentError = when {
            state.document.isBlank() -> null
            !BrazilianFormats.isValidCpf(state.document) -> "CPF inválido"
            else -> null
        }
        val phoneError = when {
            state.phone.isBlank() -> null
            !BrazilianFormats.isValidPhone(state.phone) -> "Telefone incompleto"
            else -> null
        }

        if (nameError != null || emailError != null || documentError != null || phoneError != null) {
            _uiState.update {
                it.copy(
                    nameError = nameError,
                    emailError = emailError,
                    documentError = documentError,
                    phoneError = phoneError,
                )
            }
            return
        }

        // Lê a preferência na hora do envio (e não só na criação do ViewModel) pra que uma
        // troca do ajuste nas configurações valha já no próximo cadastro.
        val autoCheckIn = printerConfigRepository.selfRegisterAutoCheckInValue

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, autoCheckIn = autoCheckIn) }

            val result = checkInRepository.selfRegister(
                name = state.name.trim(),
                email = state.email.trim(),
                document = state.document.ifBlank { null },
                phone = state.phone.ifBlank { null },
                company = state.company.trim().ifBlank { null },
                jobTitle = state.jobTitle.trim().ifBlank { null },
                autoCheckIn = autoCheckIn,
            )

            when (result) {
                is SelfRegisterResult.Success -> {
                    _uiState.update { it.copy(isLoading = false, success = result.data) }
                }
                is SelfRegisterResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }
}
