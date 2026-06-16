package com.oneid.totem.data.db

import java.util.Properties

data class DatabaseConfig(
    val host: String,
    val port: Int = 5432,
    val database: String,
    val user: String,
    val password: String,
    val sslMode: String = "require",
) {
    val jdbcUrl: String
        get() = "jdbc:postgresql://$host:$port/$database"

    fun toProperties(): Properties = Properties().apply {
        setProperty("user", user)
        setProperty("password", password)
        setProperty("sslmode", sslMode)
        setProperty("connectTimeout", "10")
        setProperty("loginTimeout", "10")
        setProperty("prepareThreshold", "0")
        setProperty("ApplicationName", "OneID-Totem-Android")
    }
}
