package com.oneid.totem.data.db

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import android.util.Log
import java.sql.Connection
import java.sql.DriverManager
import java.sql.ResultSet
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class Row(
    private val rs: ResultSet,
) {
    fun string(column: String): String? = rs.getString(column)
    fun stringNotNull(column: String): String = rs.getString(column) ?: ""
    fun int(column: String): Int = rs.getInt(column)
    fun long(column: String): Long = rs.getLong(column)
    fun double(column: String): Double? = rs.getDouble(column).let { if (rs.wasNull()) null else it }
    fun boolean(column: String): Boolean = rs.getBoolean(column)
    fun timestamp(column: String): Instant? = rs.getTimestamp(column)?.toInstant()
    fun uuid(column: String): String = rs.getString(column) ?: ""
    fun bytes(column: String): ByteArray? = rs.getBytes(column)
}

@Singleton
class DatabaseManager @Inject constructor() {

    private var connection: Connection? = null
    private var config: DatabaseConfig? = null
    private val mutex = Mutex()

    fun configure(config: DatabaseConfig) {
        this.config = config
    }

    fun isConfigured(): Boolean = config != null

    suspend fun getConnection(): Connection = withContext(Dispatchers.IO) {
        mutex.withLock {
            val cfg = config ?: throw IllegalStateException("Database not configured. Call configure() first.")
            val conn = connection
            if (conn != null && !conn.isClosed && conn.isValid(5)) {
                return@withLock conn
            }
            connection?.closeSilently()
            try {
                Class.forName("org.postgresql.Driver")
                val newConn = DriverManager.getConnection(cfg.jdbcUrl, cfg.toProperties())
                connection = newConn
                newConn
            } catch (e: Exception) {
                Log.e("DB", "Erro ao conectar em ${cfg.host}:${cfg.port}/${cfg.database} com sslmode=${cfg.sslMode}", e)
                throw e
            }
        }
    }

    suspend fun <T> query(sql: String, params: List<Any?> = emptyList(), mapper: (Row) -> T): List<T> =
        withContext(Dispatchers.IO) {
            val conn = getConnection()
            val stmt = conn.prepareStatement(sql)
            try {
                bindParams(conn, stmt, params)
                val rs = stmt.executeQuery()
                val results = mutableListOf<T>()
                while (rs.next()) {
                    results.add(mapper(Row(rs)))
                }
                results
            } finally {
                stmt.close()
            }
        }

    suspend fun <T> queryOne(sql: String, params: List<Any?> = emptyList(), mapper: (Row) -> T): T? =
        query(sql, params, mapper).firstOrNull()

    suspend fun execute(sql: String, params: List<Any?> = emptyList()): Int = withContext(Dispatchers.IO) {
        val conn = getConnection()
        val stmt = conn.prepareStatement(sql)
        try {
            bindParams(conn, stmt, params)
            stmt.executeUpdate()
        } finally {
            stmt.close()
        }
    }

    suspend fun executeAndGetGeneratedKey(sql: String, params: List<Any?> = emptyList(), keyColumn: String = "id"): String =
        withContext(Dispatchers.IO) {
            val conn = getConnection()
            val stmt = conn.prepareStatement(sql, arrayOf(keyColumn))
            try {
                bindParams(conn, stmt, params)
                stmt.executeUpdate()
                val rs = stmt.generatedKeys
                if (rs.next()) rs.getString(1) ?: UUID.randomUUID().toString()
                else UUID.randomUUID().toString()
            } finally {
                stmt.close()
            }
        }

    suspend fun <T> transaction(block: suspend TransactionContext.() -> T): T = withContext(Dispatchers.IO) {
        val conn = getConnection()
        val originalAutoCommit = conn.autoCommit
        try {
            conn.autoCommit = false
            val ctx = TransactionContext(conn, this@DatabaseManager)
            val result = block(ctx)
            conn.commit()
            result
        } catch (e: Exception) {
            conn.rollback()
            throw e
        } finally {
            conn.autoCommit = originalAutoCommit
        }
    }

    fun close() {
        connection?.closeSilently()
        connection = null
    }

    private fun bindParams(conn: Connection, stmt: java.sql.PreparedStatement, params: List<Any?>) {
        params.forEachIndexed { index, param ->
            val pos = index + 1
            when (param) {
                null -> stmt.setNull(pos, java.sql.Types.NULL)
                is String -> stmt.setString(pos, param)
                is Int -> stmt.setInt(pos, param)
                is Long -> stmt.setLong(pos, param)
                is Double -> stmt.setDouble(pos, param)
                is Boolean -> stmt.setBoolean(pos, param)
                is java.time.Instant -> stmt.setTimestamp(pos, java.sql.Timestamp(param.toEpochMilli()))
                is UUID -> stmt.setString(pos, param.toString())
                is FloatArray -> {
                    val arr = conn.createArrayOf("float8", param.map { it.toDouble() }.toTypedArray())
                    stmt.setArray(pos, arr)
                }
                is List<*> -> {
                    val arr = conn.createArrayOf("float8", param.toTypedArray())
                    stmt.setArray(pos, arr)
                }
                else -> stmt.setObject(pos, param)
            }
        }
    }

    private fun Connection.closeSilently() {
        try { close() } catch (_: Exception) {}
    }
}

class TransactionContext(
    private val conn: java.sql.Connection,
    private val dm: DatabaseManager,
) {
    suspend fun <T> query(sql: String, params: List<Any?> = emptyList(), mapper: (Row) -> T): List<T> {
        val stmt = conn.prepareStatement(sql)
        try {
            dm.bindParamsForTransaction(stmt, params)
            val rs = stmt.executeQuery()
            val results = mutableListOf<T>()
            while (rs.next()) results.add(mapper(Row(rs)))
            return results
        } finally {
            stmt.close()
        }
    }

    suspend fun execute(sql: String, params: List<Any?> = emptyList()): Int {
        val stmt = conn.prepareStatement(sql)
        try {
            dm.bindParamsForTransaction(stmt, params)
            return stmt.executeUpdate()
        } finally {
            stmt.close()
        }
    }

    suspend fun executeAndGetGeneratedKey(sql: String, params: List<Any?> = emptyList(), keyColumn: String = "id"): String {
        val stmt = conn.prepareStatement(sql, arrayOf(keyColumn))
        try {
            dm.bindParamsForTransaction(stmt, params)
            stmt.executeUpdate()
            val rs = stmt.generatedKeys
            return if (rs.next()) rs.getString(1) ?: UUID.randomUUID().toString()
            else UUID.randomUUID().toString()
        } finally {
            stmt.close()
        }
    }
}

internal fun DatabaseManager.bindParamsForTransaction(stmt: java.sql.PreparedStatement, params: List<Any?>) {
    params.forEachIndexed { index, param ->
        val pos = index + 1
        when (param) {
            null -> stmt.setNull(pos, java.sql.Types.NULL)
            is String -> stmt.setString(pos, param)
            is Int -> stmt.setInt(pos, param)
            is Long -> stmt.setLong(pos, param)
            is Double -> stmt.setDouble(pos, param)
            is Boolean -> stmt.setBoolean(pos, param)
            is java.time.Instant -> stmt.setTimestamp(pos, java.sql.Timestamp(param.toEpochMilli()))
            is UUID -> stmt.setString(pos, param.toString())
            else -> stmt.setObject(pos, param)
        }
    }
}
