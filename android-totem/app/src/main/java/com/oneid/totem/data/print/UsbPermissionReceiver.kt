package com.oneid.totem.data.print

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import kotlinx.coroutines.CompletableDeferred

class UsbPermissionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_USB_PERMISSION) return
        val device = intent.getParcelableExtra<UsbDevice>(UsbManager.EXTRA_DEVICE) ?: return
        val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
        pendingDeferrals.remove(device.deviceId)?.complete(granted)
    }

    companion object {
        const val ACTION_USB_PERMISSION = "com.oneid.totem.USB_PERMISSION"

        private val pendingDeferrals = mutableMapOf<Int, CompletableDeferred<Boolean>>()

        fun createPendingIntent(context: Context): PendingIntent {
            val intent = Intent(ACTION_USB_PERMISSION).apply {
                setPackage(context.packageName)
            }
            return PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE,
            )
        }

        suspend fun requestPermission(
            usbManager: UsbManager,
            device: UsbDevice,
            context: Context,
        ): Boolean {
            if (usbManager.hasPermission(device)) return true
            val deferred = CompletableDeferred<Boolean>()
            pendingDeferrals[device.deviceId] = deferred
            usbManager.requestPermission(device, createPendingIntent(context))
            return deferred.await()
        }
    }
}
