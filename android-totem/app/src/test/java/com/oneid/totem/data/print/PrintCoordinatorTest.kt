package com.oneid.totem.data.print

import android.graphics.Bitmap
import com.oneid.totem.domain.model.PrintData
import com.oneid.totem.domain.repository.LabelLayout
import com.oneid.totem.domain.repository.PrintRepository
import com.oneid.totem.domain.repository.PrintResult
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
class PrintCoordinatorTest {

    @MockK
    private lateinit var printRepository: PrintRepository

    @MockK
    private lateinit var badgeRenderer: BadgeRenderer

    @MockK
    private lateinit var printerConfigRepository: PrinterConfigRepository

    @MockK
    private lateinit var connectionManager: PrinterConnectionManager

    private lateinit var coordinator: PrintCoordinator

    private val sampleData = PrintData(
        jobId = "job-123",
        token = "tok-abc",
        html = """<div id="name">Test</div>""",
        paperWidth = 62.0,
        paperHeight = 50.0,
        printerDpi = 300,
        copies = 1,
    )

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        coordinator = PrintCoordinator(
            printRepository = printRepository,
            badgeRenderer = badgeRenderer,
            printerConfigRepository = printerConfigRepository,
            connectionManager = connectionManager,
        )
    }

    @Test
    fun `printBadge returns error when repository fails`() = runTest {
        coEvery { printRepository.printBadge(any(), any()) } returns PrintResult.Error("API error")

        val result = coordinator.printBadge("ep-1", null)

        assertTrue(result is PrintJobResult.Error)
        assertEquals("API error", (result as PrintJobResult.Error).message)
    }

    @Test
    fun `printBadge returns error when IP is not configured`() = runTest {
        coEvery { printRepository.printBadge(any(), any()) } returns PrintResult.Success(sampleData)
        every { printerConfigRepository.printerIpValue } returns ""

        val result = coordinator.printBadge("ep-1", null)

        assertTrue(result is PrintJobResult.Error)
        assertTrue((result as PrintJobResult.Error).message.contains("não configurada"))
    }

    @Test
    fun `printBadge returns error when render fails`() = runTest {
        coEvery { printRepository.printBadge(any(), any()) } returns PrintResult.Success(sampleData)
        every { printerConfigRepository.printerIpValue } returns "192.168.1.100"
        every { printerConfigRepository.labelLayoutValue } returns LabelLayout.STANDARD
        coEvery {
            badgeRenderer.renderFromData(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } throws RuntimeException("render crash")

        val result = coordinator.printBadge("ep-1", null)

        assertTrue(result is PrintJobResult.Error)
        assertTrue((result as PrintJobResult.Error).message.contains("renderizar"))
    }

    @Test
    fun `printBadge succeeds end to end`() = runTest {
        val bitmap = Bitmap.createBitmap(100, 200, Bitmap.Config.ARGB_8888)

        coEvery { printRepository.printBadge(any(), any()) } returns PrintResult.Success(sampleData)
        every { printerConfigRepository.printerIpValue } returns "192.168.1.100"
        every { printerConfigRepository.labelLayoutValue } returns LabelLayout.STANDARD
        coEvery {
            badgeRenderer.renderFromData(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns bitmap
        coEvery { connectionManager.printWithReconnect(any(), any(), any()) } returns PrintJobResult.Success

        val result = coordinator.printBadge("ep-1", null)

        assertTrue(result is PrintJobResult.Success)
        coVerify {
            badgeRenderer.renderFromData(
                any(), any(), any(), any(), any(), any(), any(), any(),
                eq(62.0), eq(50.0), eq(300), eq(LabelLayout.STANDARD),
            )
        }
        coVerify { connectionManager.printWithReconnect(bitmap, "192.168.1.100", 1) }
    }

    @Test
    fun `printBadge passes configured label layout to renderer`() = runTest {
        val bitmap = Bitmap.createBitmap(100, 200, Bitmap.Config.ARGB_8888)

        coEvery { printRepository.printBadge(any(), any()) } returns PrintResult.Success(sampleData)
        every { printerConfigRepository.printerIpValue } returns "192.168.1.100"
        every { printerConfigRepository.labelLayoutValue } returns LabelLayout.MINIMAL_QR
        coEvery {
            badgeRenderer.renderFromData(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns bitmap
        coEvery { connectionManager.printWithReconnect(any(), any(), any()) } returns PrintJobResult.Success

        val result = coordinator.printBadge("ep-1", null)

        assertTrue(result is PrintJobResult.Success)
        coVerify {
            badgeRenderer.renderFromData(
                any(), any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), eq(LabelLayout.MINIMAL_QR),
            )
        }
    }

    @Test
    fun `printBadge returns connection error when print fails`() = runTest {
        val bitmap = Bitmap.createBitmap(100, 200, Bitmap.Config.ARGB_8888)

        coEvery { printRepository.printBadge(any(), any()) } returns PrintResult.Success(sampleData)
        every { printerConfigRepository.printerIpValue } returns "192.168.1.100"
        every { printerConfigRepository.labelLayoutValue } returns LabelLayout.STANDARD
        coEvery {
            badgeRenderer.renderFromData(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns bitmap
        coEvery { connectionManager.printWithReconnect(any(), any(), any()) } returns PrintJobResult.Error("Erro de impressão: PaperEmpty")

        val result = coordinator.printBadge("ep-1", null)

        assertTrue(result is PrintJobResult.Error)
        assertEquals("Erro de impressão: PaperEmpty", (result as PrintJobResult.Error).message)
    }

    @Test
    fun `printWithBitmap delegates to connection manager`() = runTest {
        val bitmap = Bitmap.createBitmap(50, 50, Bitmap.Config.ARGB_8888)
        every { printerConfigRepository.printerIpValue } returns "10.0.0.50"
        coEvery { connectionManager.printWithReconnect(any(), any(), any()) } returns PrintJobResult.Success

        val result = coordinator.printWithBitmap(bitmap, sampleData)

        assertTrue(result is PrintJobResult.Success)
        coVerify { connectionManager.printWithReconnect(bitmap, "10.0.0.50", sampleData.copies) }
    }

    @Test
    fun `dispose disconnects printer`() {
        every { connectionManager.disconnect() } answers { }

        coordinator.dispose()

        coVerify(exactly = 1) { connectionManager.disconnect() }
    }
}
