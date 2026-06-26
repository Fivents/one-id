package com.oneid.totem.data.database

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private const val JDBC_URL = "postgresql://neondb_owner:npg_UlWs2kQmDHg5@ep-icy-cake-acfrcnwd-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDataSource(): HikariDataSource {
        val config = HikariConfig().apply {
            jdbcUrl = JDBC_URL
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = 4
            minimumIdle = 0
            idleTimeout = 30_000
            connectionTimeout = 10_000
            validationTimeout = 5_000
            maxLifetime = 300_000
        }
        return HikariDataSource(config)
    }

    @Provides
    @Singleton
    fun provideDatabaseDataSource(dataSource: HikariDataSource): DatabaseDataSource {
        return DatabaseDataSource(dataSource)
    }
}
