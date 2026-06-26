package com.oneid.totem.data

import com.oneid.totem.data.database.repo.DatabaseAuthRepository
import com.oneid.totem.data.database.repo.DatabaseCheckInRepository
import com.oneid.totem.data.database.repo.DatabasePrintRepository
import com.oneid.totem.data.service.FaceProcessingService
import com.oneid.totem.data.service.FaceProcessingServiceImpl
import com.oneid.totem.domain.repository.AuthRepository
import com.oneid.totem.domain.repository.CheckInRepository
import com.oneid.totem.domain.repository.PrintRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: DatabaseAuthRepository): AuthRepository

    @Binds
    @Singleton
    abstract fun bindCheckInRepository(impl: DatabaseCheckInRepository): CheckInRepository

    @Binds
    @Singleton
    abstract fun bindPrintRepository(impl: DatabasePrintRepository): PrintRepository

    @Binds
    @Singleton
    abstract fun bindFaceProcessingService(impl: FaceProcessingServiceImpl): FaceProcessingService
}
