package com.oneid.totem.data.print

/**
 * Configuração da impressora Brother QL-810W.
 * Altere PRINTER_IP para o endereço IP da sua impressora na rede Wi-Fi.
 *
 * Para descobrir o IP:
 *   1. Na impressora: Menu → Config. Rede → TCP/IP → IP Address
 *   2. Ou veja no roteador os dispositivos conectados
 */
object PrinterConfig {
    var printerIp: String = ""
        private set

    fun setIp(ip: String) {
        printerIp = ip.trim()
    }

    fun isConfigured(): Boolean = printerIp.isNotBlank()
}
