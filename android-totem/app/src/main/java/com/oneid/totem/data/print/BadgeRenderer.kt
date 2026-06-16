package com.oneid.totem.data.print

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Picture
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BadgeRenderer @Inject constructor(
    @ApplicationContext private val context: Context,
) {

    private var webView: WebView? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    suspend fun render(
        html: String,
        paperWidthMm: Double,
        paperHeightMm: Double,
        dpi: Int,
    ): Bitmap = withContext(Dispatchers.Main) {
        val widthPx = inchesToPixels(paperWidthMm / 25.4, dpi)
        val heightPx = inchesToPixels(paperHeightMm / 25.4, dpi)

        val view = ensureWebView()
        view.layoutParams = ViewGroup.LayoutParams(widthPx, heightPx)
        view.measure(
            View.MeasureSpec.makeMeasureSpec(widthPx, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(heightPx, View.MeasureSpec.EXACTLY),
        )
        view.layout(0, 0, widthPx, heightPx)

        loadHtml(view, html)

        view.layoutParams = ViewGroup.LayoutParams(widthPx, heightPx)
        view.measure(
            View.MeasureSpec.makeMeasureSpec(widthPx, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(heightPx, View.MeasureSpec.EXACTLY),
        )
        view.layout(0, 0, widthPx, heightPx)

        val picture = capturePicture(view)
        val bitmap = pictureToBitmap(picture, widthPx, heightPx)
        val scaled = Bitmap.createScaledBitmap(bitmap, widthPx, heightPx, true)
        if (scaled != bitmap) bitmap.recycle()
        scaled
    }

    private fun ensureWebView(): WebView {
        if (webView == null) {
            webView = WebView(context).apply {
                setInitialScale(100)
                settings.apply {
                    loadsImagesAutomatically = true
                    javaScriptEnabled = true
                    layoutAlgorithm = WebSettings.LayoutAlgorithm.SINGLE_COLUMN
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    builtInZoomControls = false
                    displayZoomControls = false
                    defaultFontSize = 14
                    minimumFontSize = 6
                }
            }
        }
        return webView!!
    }

    private suspend fun loadHtml(webView: WebView, html: String) = suspendCancellableCoroutine<Unit> { cont ->
        mainHandler.post {
            webView.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView, url: String) {
                    view.postDelayed({ cont.resume(Unit, null) }, 200)
                }
            }
            webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
        }
    }

    fun dispose() {
        mainHandler.post {
            webView?.destroy()
            webView = null
        }
    }

    companion object {
        private fun inchesToPixels(inches: Double, dpi: Int): Int {
            return (inches * dpi).toInt().coerceAtLeast(1)
        }

        private fun capturePicture(view: WebView): Picture {
            val picture = Picture()
            val canvas = picture.beginRecording(view.width, view.height)
            view.draw(canvas)
            picture.endRecording()
            return picture
        }

        private fun pictureToBitmap(picture: Picture, width: Int, height: Int): Bitmap {
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            canvas.drawColor(android.graphics.Color.WHITE)
            picture.draw(canvas)
            return bitmap
        }
    }
}
