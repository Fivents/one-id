package com.oneid.totem.data.database

import com.zaxxer.hikari.HikariDataSource
import java.sql.Timestamp
import javax.inject.Inject
import javax.inject.Singleton

typealias RowMap = Map<String, Any?>

@Singleton
class DatabaseDataSource @Inject constructor(
    private val dataSource: HikariDataSource,
) {

    fun queryForList(sql: String, vararg params: Any?): List<RowMap> {
        val conn = dataSource.connection
        val result = try {
            val stmt = conn.prepareStatement(sql)
            try {
                setParams(stmt, params)
                val rs = stmt.executeQuery()
                try {
                    val meta = rs.metaData
                    val cols = (1..meta.columnCount).map { meta.getColumnLabel(it) }
                    val rows = mutableListOf<RowMap>()
                    while (rs.next()) {
                        rows.add(cols.associateWith { col ->
                            val idx = cols.indexOf(col) + 1
                            val v = rs.getObject(idx)
                            when (v) {
                                is Timestamp -> v.toInstant().toString()
                                is java.sql.Date -> v.toString()
                                else -> v
                            }
                        })
                    }
                    rows
                } finally {
                    rs.close()
                }
            } finally {
                stmt.close()
            }
        } finally {
            conn.close()
        }
        return result
    }

    fun queryForOne(sql: String, vararg params: Any?): RowMap? {
        return queryForList(sql, *params).firstOrNull()
    }

    fun execute(sql: String, vararg params: Any?): Int {
        val conn = dataSource.connection
        val result = try {
            val stmt = conn.prepareStatement(sql)
            try {
                setParams(stmt, params)
                stmt.executeUpdate()
            } finally {
                stmt.close()
            }
        } finally {
            conn.close()
        }
        return result
    }

    fun executeReturning(sql: String, vararg params: Any?): RowMap? {
        val conn = dataSource.connection
        val result = try {
            val stmt = conn.prepareStatement(sql)
            try {
                setParams(stmt, params)
                val rs = stmt.executeQuery()
                try {
                    if (rs.next()) {
                        val meta = rs.metaData
                        val cols = (1..meta.columnCount).map { meta.getColumnLabel(it) }
                        cols.associateWith { col ->
                            val idx = cols.indexOf(col) + 1
                            val v = rs.getObject(idx)
                            when (v) {
                                is Timestamp -> v.toInstant().toString()
                                is java.sql.Date -> v.toString()
                                else -> v
                            }
                        }
                    } else null
                } finally {
                    rs.close()
                }
            } finally {
                stmt.close()
            }
        } finally {
            conn.close()
        }
        return result
    }

    private fun setParams(stmt: java.sql.PreparedStatement, params: Array<out Any?>) {
        params.forEachIndexed { i, param ->
            when (param) {
                null -> stmt.setNull(i + 1, java.sql.Types.NULL)
                is String -> stmt.setString(i + 1, param)
                is Int -> stmt.setInt(i + 1, param)
                is Long -> stmt.setLong(i + 1, param)
                is Double -> stmt.setDouble(i + 1, param)
                is Float -> stmt.setFloat(i + 1, param)
                is Boolean -> stmt.setBoolean(i + 1, param)
                is java.util.Date -> stmt.setTimestamp(i + 1, Timestamp(param.time))
                else -> stmt.setObject(i + 1, param)
            }
        }
    }

    fun close() {
        if (!dataSource.isClosed) {
            dataSource.close()
        }
    }
}
