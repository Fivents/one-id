package com.oneid.totem.data.print

import android.graphics.Bitmap
import io.mockk.MockKAnnotations
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.impl.annotations.MockK
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PrinterConnectionManagerTest {

    @MockK
    private lateinit var printer: BrotherPrinter

    private lateinit var manager: PrinterConnectionManager

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        manager = PrinterConnectionManager(printer)
    }

    @Test
    fun `ensureConnected connects when printer not connected`() = runTest {
        coEvery { printer.isConnected() } returns false
        coEvery { printer.connect(any()) } returns PrintJobResult.Success

        val result = manager.ensureConnected("192.168.1.100")

        assertTrue(result is PrintJobResult.Success)
        coVerify(exactly = 1) { printer.connect("192.168.1.100") }
    }

    @Test
    fun `ensureConnected reuses existing connection to same IP`() = runTest {
        coEvery { printer.isConnected() } returns true
        coEvery { printer.connect(any()) } returns PrintJobResult.Success

        manager.ensureConnected("192.168.1.100")
        val result = manager.ensureConnected("192.168.1.100")

        assertTrue(result is PrintJobResult.Success)
        coVerify(exactly = 1) { printer.connect(any()) }
    }

    @Test
    fun `ensureConnected reconnects when IP changes`() = runTest {
        coEvery { printer.isConnected() } returns true
        coEvery { printer.connect(any()) } returns PrintJobResult.Success

        manager.ensureConnected("192.168.1.100")
        val result = manager.ensureConnected("10.0.0.1")

        assertTrue(result is PrintJobResult.Success)
        coVerify(exactly = 2) { printer.connect(any()) }
    }

    @Test
    fun `ensureConnected reconnects when probe fails on same IP`() = runTest {
        coEvery { printer.isConnected() } returns false
        coEvery { printer.connect(any()) } returns PrintJobResult.Success

        manager.ensureConnected("192.168.1.100")
        val result = manager.ensureConnected("192.168.1.100")

        assertTrue(result is PrintJobResult.Success)
        coVerify(exactly = 2) { printer.connect(any()) }
    }

    @Test
    fun `ensureConnected retries up to MAX_RETRIES then fails`() = runTest {
        coEvery { printer.isConnected() } returns false
        coEvery { printer.connect(any()) } returns PrintJobResult.Error("fail")

        val result = manager.ensureConnected("192.168.1.100")

        assertTrue(result is PrintJobResult.Error)
        assertTrue((result as PrintJobResult.Error).message.contains("5"))
        coVerify(exactly = 5) { printer.connect(any()) }
    }

    @Test
    fun `printWithReconnect succeeds when connect and print succeed`() = runTest {
        coEvery { printer.isConnected() } returns false
        coEvery { printer.connect(any()) } returns PrintJobResult.Success
        coEvery { printer.printBitmap(any(), any()) } returns PrintJobResult.Success

        val bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
        val result = manager.printWithReconnect(bitmap, "192.168.1.100")

        assertTrue(result is PrintJobResult.Success)
        coVerify(exactly = 1) { printer.connect(any()) }
        coVerify(exactly = 1) { printer.printBitmap(bitmap, 1) }
    }

    @Test
    fun `printWithReconnect closes on print failure`() = runTest {
        coEvery { printer.isConnected() } returns false
        coEvery { printer.connect(any()) } returns PrintJobResult.Success
        coEvery { printer.printBitmap(any(), any()) } returns PrintJobResult.Error("print fail")
        every { printer.close() } answers { }

        val bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
        val result = manager.printWithReconnect(bitmap, "192.168.1.100")

        assertTrue(result is PrintJobResult.Error)
        assertEquals("print fail", (result as PrintJobResult.Error).message)
        coVerify(exactly = 1) { printer.close() }
    }

    @Test
    fun `disconnect closes printer`() {
        every { printer.close() } answers { }

        manager.disconnect()

        coVerify(exactly = 1) { printer.close() }
    }
}
