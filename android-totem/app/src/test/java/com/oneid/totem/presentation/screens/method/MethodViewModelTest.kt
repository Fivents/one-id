package com.oneid.totem.presentation.screens.method

import android.content.Context
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.data.print.PrintJobResult
import com.oneid.totem.data.print.PrinterConfigRepository
import com.oneid.totem.data.print.PrinterConnectionManager
import com.oneid.totem.data.print.PrinterConnectionType
import com.oneid.totem.data.print.UsbPrinterDiscovery
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
import io.mockk.mockk
import io.mockk.runs
import io.mockk.verify
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
    private lateinit var printerConnectionManager: PrinterConnectionManager

    @MockK
    private lateinit var usbPrinterDiscovery: UsbPrinterDiscovery

    @MockK
    private lateinit var modelDownloader: ModelDownloader

    @MockK
    private lateinit var totemPreferences: TotemPreferences

    private lateinit var appContext: Context
    private lateinit var viewModel: MethodViewModel

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        Dispatchers.setMain(UnconfinedTestDispatcher())

        appContext = mockk(relaxed = true)
        every { printerConfigRepository.load() } just runs
        every { printerConfigRepository.printerIp } returns MutableStateFlow("")
        every { printerConfigRepository.connectionType } returns MutableStateFlow(PrinterConnectionType.WIFI)
        every { printerConfigRepository.settingsSecurityCodeEnabled } returns MutableStateFlow(false)
        every { printerConfigRepository.setConnectionType(any()) } just runs
        every { usbPrinterDiscovery.hasUsbPrinter() } returns false
        coEvery { printerConnectionManager.autoDetectAndConnect(any()) } returns
            (PrintJobResult.Error("Nenhuma impressora encontrada") to PrinterConnectionType.WIFI)
        every { modelDownloader.downloadState } returns MutableStateFlow(ModelDownloadState.NotStarted)
        coEvery { authRepository.validateSession() } returns AuthResult.Success(sampleSession())

        viewModel = MethodViewModel(
            appContext = appContext,
            authRepository = authRepository,
            printerConfigRepository = printerConfigRepository,
            printerConnectionManager = printerConnectionManager,
            usbPrinterDiscovery = usbPrinterDiscovery,
            modelDownloader = modelDownloader,
            totemPreferences = totemPreferences,
        )
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
    fun `uiState reflects settingsSecurityCodeEnabled from the repository`() {
        every { printerConfigRepository.settingsSecurityCodeEnabled } returns MutableStateFlow(true)

        viewModel = MethodViewModel(
            appContext = appContext,
            authRepository = authRepository,
            printerConfigRepository = printerConfigRepository,
            printerConnectionManager = printerConnectionManager,
            usbPrinterDiscovery = usbPrinterDiscovery,
            modelDownloader = modelDownloader,
            totemPreferences = totemPreferences,
        )

        assertTrue(viewModel.uiState.value.settingsSecurityCodeEnabled)
    }

    @Test
    fun `logout sets hasLoggedOut`() {
        coEvery { authRepository.logout() } just runs

        viewModel.logout()

        assertTrue(viewModel.uiState.value.hasLoggedOut)
    }

    @Test
    fun `autoDetectPrinter switches saved WIFI config to USB when a USB printer is detected`() {
        coEvery { printerConnectionManager.autoDetectAndConnect(any()) } returns
            (PrintJobResult.Success to PrinterConnectionType.USB)

        viewModel = MethodViewModel(
            appContext = appContext,
            authRepository = authRepository,
            printerConfigRepository = printerConfigRepository,
            printerConnectionManager = printerConnectionManager,
            usbPrinterDiscovery = usbPrinterDiscovery,
            modelDownloader = modelDownloader,
            totemPreferences = totemPreferences,
        )

        verify { printerConfigRepository.setConnectionType(PrinterConnectionType.USB) }
        assertTrue(viewModel.uiState.value.usbAvailable)
    }

    @Test
    fun `autoDetectPrinter keeps saved WIFI config when no USB printer is found`() {
        coEvery { printerConnectionManager.autoDetectAndConnect(any()) } returns
            (PrintJobResult.Error("Nenhuma impressora encontrada") to PrinterConnectionType.WIFI)

        viewModel = MethodViewModel(
            appContext = appContext,
            authRepository = authRepository,
            printerConfigRepository = printerConfigRepository,
            printerConnectionManager = printerConnectionManager,
            usbPrinterDiscovery = usbPrinterDiscovery,
            modelDownloader = modelDownloader,
            totemPreferences = totemPreferences,
        )

        verify(exactly = 0) { printerConfigRepository.setConnectionType(PrinterConnectionType.USB) }
        assertFalse(viewModel.uiState.value.usbAvailable)
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
