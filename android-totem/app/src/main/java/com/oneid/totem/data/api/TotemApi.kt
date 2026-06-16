package com.oneid.totem.data.api

import com.oneid.totem.data.api.dto.*
import retrofit2.Response
import retrofit2.http.*

interface TotemApi {

    @POST("api/totem/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/totem/session")
    suspend fun getSession(): Response<SessionResponse>

    @POST("api/totem/checkin")
    suspend fun faceCheckIn(@Body request: FaceCheckInRequest): Response<CheckInResponse>

    @POST("api/totem/checkin")
    suspend fun qrCheckIn(@Body request: QrCheckInRequest): Response<CheckInResponse>

    @POST("api/totem/checkin")
    suspend fun codeCheckIn(@Body request: CodeCheckInRequest): Response<CheckInResponse>

    @POST("api/totem/self-register")
    suspend fun selfRegister(@Body request: SelfRegisterRequest): Response<SelfRegisterResponse>

    @POST("api/totem/print")
    suspend fun printBadge(@Body request: PrintRequest): Response<PrintResponse>

    @GET("api/totem/print-config")
    suspend fun getPrintConfig(): Response<PrintConfigResponse>

    @GET("api/totem/event-config")
    suspend fun getEventConfig(): Response<EventConfigResponse>
}
