package com.oneid.totem.presentation.screens.checkin.code

import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.domain.repository.AccessCodeKeyboard
import com.oneid.totem.domain.repository.CheckInRepository
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.MockK
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class CodeCheckInViewModelTest {

    @MockK
    private lateinit var checkInRepository: CheckInRepository

    @MockK
    private lateinit var totemPreferences: TotemPreferences

    private lateinit var viewModel: CodeCheckInViewModel

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `numeric keyboard filters out letters`() {
        every { totemPreferences.accessCodeKeyboard } returns AccessCodeKeyboard.NUMERIC
        viewModel = CodeCheckInViewModel(checkInRepository, totemPreferences)

        viewModel.onCodeChanged("AB12CD")

        assertEquals("12", viewModel.uiState.value.code)
    }

    @Test
    fun `alphanumeric keyboard keeps letters and digits uppercased`() {
        every { totemPreferences.accessCodeKeyboard } returns AccessCodeKeyboard.ALPHANUMERIC
        viewModel = CodeCheckInViewModel(checkInRepository, totemPreferences)

        viewModel.onCodeChanged("ab12")

        assertEquals("AB12", viewModel.uiState.value.code)
    }

    @Test
    fun `numeric keyboard flag is true when mode is numeric`() {
        every { totemPreferences.accessCodeKeyboard } returns AccessCodeKeyboard.NUMERIC

        viewModel = CodeCheckInViewModel(checkInRepository, totemPreferences)

        assertEquals(true, viewModel.uiState.value.numericKeyboard)
    }

    @Test
    fun `numeric keyboard flag is false by default`() {
        every { totemPreferences.accessCodeKeyboard } returns AccessCodeKeyboard.ALPHANUMERIC

        viewModel = CodeCheckInViewModel(checkInRepository, totemPreferences)

        assertEquals(false, viewModel.uiState.value.numericKeyboard)
    }
}
