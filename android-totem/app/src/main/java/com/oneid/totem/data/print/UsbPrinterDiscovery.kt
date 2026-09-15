package com.oneid.totem.data.print

import android.content.Context
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

private const val BROTHER_VENDOR_ID = 0x04F9

@Singleton
class UsbPrinterDiscovery @Inject constructor(
    @ApplicationContext private val appContext: Context,
) {

    private val usbManager: UsbManager by lazy {
        appContext.getSystemService(Context.USB_SERVICE) as UsbManager
    }

    fun resolveUsbManager(): UsbManager = usbManager

    fun findConnectedPrinter(): UsbDevice? {
        return usbManager.deviceList.values.firstOrNull { device ->
            device.vendorId == BROTHER_VENDOR_ID && isLikelyPrinter(device)
        }
    }

    fun findAllConnectedPrinters(): List<UsbPrinterInfo> {
        return usbManager.deviceList.values
            .filter { device -> device.vendorId == BROTHER_VENDOR_ID && isLikelyPrinter(device) }
            .map { device ->
                UsbPrinterInfo(
                    deviceName = device.productName ?: device.deviceName,
                    vendorId = device.vendorId,
                    productId = device.productId,
                )
            }
    }

    fun hasUsbPrinter(): Boolean = findConnectedPrinter() != null

    suspend fun requestPermission(device: UsbDevice): Boolean {
        return UsbPermissionReceiver.requestPermission(usbManager, device, appContext)
    }

    private fun isLikelyPrinter(device: UsbDevice): Boolean {
        if (device.productName?.lowercase()?.contains("ql") == true) return true
        if (device.deviceName.lowercase().contains("ql")) return true
        val interfaceCount = device.interfaceCount
        for (i in 0 until interfaceCount) {
            val iface = device.getInterface(i)
            if (iface.interfaceClass == 0x07) return true
        }
        return false
    }
}
