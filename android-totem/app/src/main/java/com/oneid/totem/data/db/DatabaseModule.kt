package com.oneid.totem.data.db

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabaseManager(): DatabaseManager = DatabaseManager()

    @Provides
    @Singleton
    fun provideActiveEventResolver(db: DatabaseManager): ActiveEventResolver = ActiveEventResolver(db)

    @Provides
    @Singleton
    fun provideCheckInDao(db: DatabaseManager): CheckInDao = CheckInDao(db)

    @Provides
    @Singleton
    fun provideFaceDao(db: DatabaseManager): FaceDao = FaceDao(db)

    @Provides
    @Singleton
    fun provideSelfRegisterDao(db: DatabaseManager): SelfRegisterDao = SelfRegisterDao(db)

    @Provides
    @Singleton
    fun providePrintDao(db: DatabaseManager): PrintDao = PrintDao(db)
}
