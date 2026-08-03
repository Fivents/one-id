package com.oneid.totem.presentation.screens.method

import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.data.service.ModelDownloadState
import com.oneid.totem.data.service.ModelDownloader
import com.oneid.totem.domain.model.AIConfig
import com.oneid.totem.domain.model.EventConfig
import com.oneid.totem.domain.model.TotemSession
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.AuthResult
import io.mockk.MockKAnnotations
import io.mockk.coEvery
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.just
import io.mockk.runs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class MethodViewModelTest {

    @MockK
    private lateinit var authRepository: AuthRepository

    @MockK
    private lateinit var printerConfigRepository: PrinterConfigRepository

    @MockK
    private lateinit var modelDownloader: ModelDownloader

    @MockK
    private lateinit var totemPreferences: TotemPreferences

    private lateinit var viewModel: MethodViewModel

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        Dispatchers.setMain(UnconfinedTestDispatcher())

        every { printerConfigRepository.load() } just runs
        every { printerConfigRepository.printerIp } returns MutableStateFlow("")
        every { modelDownloader.downloadState } returns MutableStateFlow(ModelDownloadState.NotStarted)
        coEvery { authRepository.validateSession() } returns AuthResult.Success(sampleSession())

        viewModel = MethodViewModel(authRepository, printerConfigRepository, modelDownloader, totemPreferences)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `isAccessCodeValid returns false when no access code is persisted`() {
        every { totemPreferences.totemAccessCode } returns ""

        assertFalse(viewModel.isAccessCodeValid("ABC12345"))
    }

    @Test
    fun `isAccessCodeValid accepts exact match`() {
        every { totemPreferences.totemAccessCode } returns "ABC12345"

        assertTrue(viewModel.isAccessCodeValid("ABC12345"))
    }

    @Test
    fun `isAccessCodeValid is case-insensitive`() {
        every { totemPreferences.totemAccessCode } returns "abc12345"

        assertTrue(viewModel.isAccessCodeValid("ABC12345"))
    }

    @Test
    fun `isAccessCodeValid trims whitespace`() {
        every { totemPreferences.totemAccessCode } returns "  ABC12345  "

        assertTrue(viewModel.isAccessCodeValid("ABC12345"))
    }

    @Test
    fun `isAccessCodeValid rejects wrong code`() {
        every { totemPreferences.totemAccessCode } returns "ABC12345"

        assertFalse(viewModel.isAccessCodeValid("XYZ99999"))
    }

    @Test
    fun `logout sets hasLoggedOut`() {
        coEvery { authRepository.logout() } just runs

        viewModel.logout()

        assertTrue(viewModel.uiState.value.hasLoggedOut)
    }

    private fun sampleSession() = TotemSession(
        sessionId = "s1",
        expiresAt = "2026-08-03",
        totemId = "t1",
        totemName = "Totem Teste",
        activeEvent = EventConfig(
            id = "e1",
            name = "Evento Teste",
            faceEnabled = true,
            qrEnabled = true,
            codeEnabled = false,
            allowSelfRegistration = false,
            hasPrintConfig = true,
        ),
        totemEventSubscriptionId = "sub1",
        aiConfig = AIConfig(
            confidenceThreshold = 0.5,
            maxFaces = 1,
            minFaceSize = 64,
            livenessDetection = false,
            livenessThreshold = 0.5,
            cooldownSeconds = 5,
        ),
    )
}
