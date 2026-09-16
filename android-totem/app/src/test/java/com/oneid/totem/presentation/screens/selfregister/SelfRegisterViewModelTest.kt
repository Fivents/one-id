package com.oneid.totem.presentation.screens.selfregister

import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.domain.model.ParticipantInfo
import com.oneid.totem.domain.model.SelfRegistration
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.SelfRegisterResult
import io.mockk.MockKAnnotations
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.impl.annotations.MockK
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SelfRegisterViewModelTest {

    @MockK
    private lateinit var checkInRepository: CheckInRepository

    @MockK
    private lateinit var printerConfigRepository: PrinterConfigRepository

    private lateinit var viewModel: SelfRegisterViewModel

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        Dispatchers.setMain(UnconfinedTestDispatcher())
        every { printerConfigRepository.selfRegisterAutoCheckInValue } returns true
        coEvery {
            checkInRepository.selfRegister(any(), any(), any(), any(), any(), any(), any())
        } returns SelfRegisterResult.Success(registration(checkedIn = true))
        viewModel = SelfRegisterViewModel(checkInRepository, printerConfigRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `name and email are required`() {
        viewModel.submit()

        val state = viewModel.uiState.value
        assertEquals("Informe seu nome completo", state.nameError)
        assertEquals("Informe seu e-mail", state.emailError)
        coVerify(exactly = 0) {
            checkInRepository.selfRegister(any(), any(), any(), any(), any(), any(), any())
        }
    }

    @Test
    fun `invalid email blocks the submission`() {
        viewModel.onNameChanged("Maria Oliveira")
        viewModel.onEmailChanged("maria@empresa")

        viewModel.submit()

        assertEquals("E-mail inválido", viewModel.uiState.value.emailError)
        coVerify(exactly = 0) {
            checkInRepository.selfRegister(any(), any(), any(), any(), any(), any(), any())
        }
    }

    @Test
    fun `document and phone are optional but validated once filled`() {
        viewModel.onNameChanged("Maria Oliveira")
        viewModel.onEmailChanged("maria@empresa.com")
        viewModel.onDocumentChanged("123.456.789-00")
        viewModel.onPhoneChanged("1199")

        viewModel.submit()

        val state = viewModel.uiState.value
        assertEquals("CPF inválido", state.documentError)
        assertEquals("Telefone incompleto", state.phoneError)
    }

    @Test
    fun `empty document and phone do not block the submission`() {
        viewModel.onNameChanged("Maria Oliveira")
        viewModel.onEmailChanged("maria@empresa.com")

        viewModel.submit()

        val state = viewModel.uiState.value
        assertNull(state.documentError)
        assertNull(state.phoneError)
        assertNotNull(state.success)
    }

    @Test
    fun `optional fields are sent unmasked and the extra ones reach the api`() {
        viewModel.onNameChanged("  Maria Oliveira  ")
        viewModel.onEmailChanged(" maria@empresa.com ")
        viewModel.onDocumentChanged("529.982.247-25")
        viewModel.onPhoneChanged("(11) 99999-8888")
        viewModel.onCompanyChanged("Empresa Exemplo")
        viewModel.onJobTitleChanged("Diretora de Marketing")

        viewModel.submit()

        coVerify(exactly = 1) {
            checkInRepository.selfRegister(
                name = "Maria Oliveira",
                email = "maria@empresa.com",
                document = "52998224725",
                phone = "11999998888",
                company = "Empresa Exemplo",
                jobTitle = "Diretora de Marketing",
                autoCheckIn = true,
            )
        }
    }

    @Test
    fun `auto check-in preference of the totem is what goes to the api`() {
        every { printerConfigRepository.selfRegisterAutoCheckInValue } returns false
        coEvery {
            checkInRepository.selfRegister(any(), any(), any(), any(), any(), any(), any())
        } returns SelfRegisterResult.Success(registration(checkedIn = false))

        viewModel.onNameChanged("Maria Oliveira")
        viewModel.onEmailChanged("maria@empresa.com")
        viewModel.submit()

        coVerify(exactly = 1) {
            checkInRepository.selfRegister(any(), any(), any(), any(), any(), any(), autoCheckIn = false)
        }
        val registration = viewModel.uiState.value.success
        assertNotNull(registration)
        assertFalse(registration!!.checkedIn)
        assertNull(registration.checkInId)
    }

    @Test
    fun `api error is surfaced and no navigation is triggered`() {
        coEvery {
            checkInRepository.selfRegister(any(), any(), any(), any(), any(), any(), any())
        } returns SelfRegisterResult.Error("PARTICIPANT_ALREADY_REGISTERED", "Este e-mail já está inscrito neste evento")

        viewModel.onNameChanged("Maria Oliveira")
        viewModel.onEmailChanged("maria@empresa.com")
        viewModel.submit()

        val state = viewModel.uiState.value
        assertEquals("Este e-mail já está inscrito neste evento", state.error)
        assertNull(state.success)
        assertFalse(state.isLoading)
    }

    @Test
    fun `masked values are exposed for the fields while the state keeps digits only`() {
        viewModel.onDocumentChanged("52998224725")
        viewModel.onPhoneChanged("11999998888")

        val state = viewModel.uiState.value
        assertEquals("52998224725", state.document)
        assertEquals("529.982.247-25", state.documentMasked)
        assertEquals("11999998888", state.phone)
        assertEquals("(11) 99999-8888", state.phoneMasked)
    }

    private fun registration(checkedIn: Boolean) = SelfRegistration(
        checkInId = if (checkedIn) "checkin-1" else null,
        eventParticipantId = "ep-1",
        checkedIn = checkedIn,
        participant = ParticipantInfo(
            name = "Maria Oliveira",
            company = "Empresa Exemplo",
            jobTitle = "Diretora de Marketing",
            imageUrl = null,
            accessCode = "AB12CD",
            qrCodeValue = "qr-1",
        ),
    )
}
