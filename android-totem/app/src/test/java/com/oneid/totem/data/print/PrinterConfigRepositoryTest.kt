package com.oneid.totem.data.print

import com.oneid.totem.data.local.TokenStorage
import com.oneid.totem.data.local.TotemPreferences
import com.oneid.totem.domain.repository.AccessCodeKeyboard
import com.oneid.totem.domain.repository.LabelLayout
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.just
import io.mockk.runs
import io.mockk.verify
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class PrinterConfigRepositoryTest {

    @MockK
    private lateinit var tokenStorage: TokenStorage

    @MockK
    private lateinit var prefs: TotemPreferences

    private lateinit var repository: PrinterConfigRepository

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        every { prefs.printerOrientation } returns "PORTRAIT"
        every { prefs.printerLabelLayout } returns LabelLayout.STANDARD
        every { prefs.accessCodeKeyboard } returns AccessCodeKeyboard.ALPHANUMERIC
        repository = PrinterConfigRepository(tokenStorage, prefs)
    }

    @Test
    fun `load restores saved IP`() {
        every { tokenStorage.getPrinterIp() } returns "192.168.1.100"

        repository.load()

        assertEquals("192.168.1.100", repository.printerIpValue)
    }

    @Test
    fun `load does not change IP when saved value is null`() {
        every { tokenStorage.getPrinterIp() } returns null

        repository.load()

        assertEquals("", repository.printerIpValue)
    }

    @Test
    fun `load does not change IP when saved value is blank`() {
        every { tokenStorage.getPrinterIp() } returns "   "

        repository.load()

        assertEquals("", repository.printerIpValue)
    }

    @Test
    fun `setIp updates value and persists`() = runTest {
        every { tokenStorage.savePrinterIp(any()) } just runs

        repository.setIp("10.0.0.50")

        assertEquals("10.0.0.50", repository.printerIpValue)
        verify { tokenStorage.savePrinterIp("10.0.0.50") }
    }

    @Test
    fun `setIp trims whitespace`() = runTest {
        every { tokenStorage.savePrinterIp(any()) } just runs

        repository.setIp("  192.168.1.1  ")

        assertEquals("192.168.1.1", repository.printerIpValue)
        verify { tokenStorage.savePrinterIp("192.168.1.1") }
    }

    @Test
    fun `printerIp flow emits updates`() = runTest {
        every { tokenStorage.savePrinterIp(any()) } just runs

        repository.setIp("192.168.1.1")
        assertEquals("192.168.1.1", repository.printerIp.first())

        repository.setIp("10.0.0.1")
        assertEquals("10.0.0.1", repository.printerIp.first())
    }

    @Test
    fun `load restores saved access code keyboard`() {
        every { tokenStorage.getPrinterIp() } returns null
        every { prefs.accessCodeKeyboard } returns AccessCodeKeyboard.NUMERIC

        repository.load()

        assertEquals(AccessCodeKeyboard.NUMERIC, repository.accessCodeKeyboardValue)
    }

    @Test
    fun `setAccessCodeKeyboard updates value and persists`() = runTest {
        every { prefs.accessCodeKeyboard = any() } just runs

        repository.setAccessCodeKeyboard(AccessCodeKeyboard.NUMERIC)

        assertEquals(AccessCodeKeyboard.NUMERIC, repository.accessCodeKeyboardValue)
        assertEquals(AccessCodeKeyboard.NUMERIC, repository.accessCodeKeyboard.first())
        verify { prefs.accessCodeKeyboard = AccessCodeKeyboard.NUMERIC }
    }

    @Test
    fun `isConfigured returns false when IP is blank`() {
        assertFalse(repository.isConfigured())
    }

    @Test
    fun `isConfigured returns true after IP is set`() {
        repository.setIp("10.0.0.1")
        assertTrue(repository.isConfigured())
    }
}
