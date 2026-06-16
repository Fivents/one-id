package com.oneid.totem.data

import com.oneid.totem.data.repository.impl.AuthRepositoryImpl
import com.oneid.totem.data.repository.impl.CheckInRepositoryImpl
import com.oneid.totem.data.repository.impl.PrintRepositoryImpl
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
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindCheckInRepository(impl: CheckInRepositoryImpl): CheckInRepository

    @Binds
    @Singleton
    abstract fun bindPrintRepository(impl: PrintRepositoryImpl): PrintRepository

    @Binds
    @Singleton
    abstract fun bindFaceProcessingService(impl: FaceProcessingServiceImpl): FaceProcessingService
}
