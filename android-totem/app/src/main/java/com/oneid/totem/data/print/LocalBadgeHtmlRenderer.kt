package com.oneid.totem.data.print

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocalBadgeHtmlRenderer @Inject constructor() {

    fun render(
        participantName: String,
        company: String?,
        jobTitle: String?,
        accessCode: String?,
        qrCodeValue: String?,
        eventName: String,
        showQrCode: Boolean,
        showAccessCode: Boolean,
        fontSizeName: Int,
        fontSizeMeta: Int,
        paperWidthMm: Double,
    ): String {
        val safeName = escapeHtml(participantName.ifBlank { "Convidado" })
        val safeCompany = company?.let { escapeHtml(it) }
        val safeJobTitle = jobTitle?.let { escapeHtml(it) }
        val safeEventName = escapeHtml(eventName.ifBlank { "Evento" })
        val safeAccessCode = if (showAccessCode) accessCode?.let { escapeHtml(it) } else null

        val metaParts = listOfNotNull(safeCompany, safeJobTitle)
        val metaLine = if (metaParts.isNotEmpty()) metaParts.joinToString(" · ") else ""

        val qrHtml = if (showQrCode && qrCodeValue != null && qrCodeValue.isNotBlank()) {
            val qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${escapeUrl(qrCodeValue)}"
            """
            <div style="text-align:center;margin:6px 0 0">
              <img src="$qrUrl" width="100" height="100" style="display:block;margin:0 auto" />
            </div>
            """.trimIndent()
        } else ""

        val accessCodeHtml = if (safeAccessCode != null) {
            """
            <div style="text-align:center;margin:2px 0;font-size:9px;color:#6b7280;letter-spacing:2px">
              ${safeAccessCode}
            </div>
            """.trimIndent()
        } else ""

        return """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              width: ${paperWidthMm}mm;
              background: white;
              padding: 8mm 6mm;
            }
            .event-name {
              text-align: center;
              font-size: ${fontSizeMeta - 1}px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 4px;
            }
            .name {
              text-align: center;
              font-size: ${fontSizeName}px;
              font-weight: 700;
              color: #111827;
              margin: 4px 0;
              line-height: 1.2;
            }
            .meta {
              text-align: center;
              font-size: ${fontSizeMeta}px;
              color: #4b5563;
              margin: 2px 0;
              line-height: 1.3;
            }
            hr {
              border: none;
              border-top: 1px dashed #d1d5db;
              margin: 6px 0;
            }
          </style>
        </head>
        <body>
          <div class="event-name">$safeEventName</div>
          <hr/>
          <div class="name">$safeName</div>
          ${if (metaLine.isNotBlank()) "<div class=\"meta\">$metaLine</div>" else ""}
          $qrHtml
          $accessCodeHtml
        </body>
        </html>
        """.trimIndent()
    }

    private fun escapeHtml(text: String): String {
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#039;")
    }

    private fun escapeUrl(text: String): String {
        return java.net.URLEncoder.encode(text, "UTF-8")
    }
}
