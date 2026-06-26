package com.oneid.totem.data.api

import com.oneid.totem.data.api.dto.CodeCheckInRequest
import com.oneid.totem.data.api.dto.FaceCheckInRequest
import com.oneid.totem.data.api.dto.LoginRequest
import com.oneid.totem.data.api.dto.LoginResponse
import com.oneid.totem.data.api.dto.PrintBadgeRequest
import com.oneid.totem.data.api.dto.PrintBadgeResponse
import com.oneid.totem.data.api.dto.PrintConfigResponse
import com.oneid.totem.data.api.dto.QrCheckInRequest
import com.oneid.totem.data.api.dto.SelfRegisterRequest
import com.oneid.totem.data.api.dto.SelfRegisterResponse
import com.oneid.totem.data.api.dto.CheckInResponse
import com.oneid.totem.data.api.dto.SessionResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface TotemApi {

    @POST("api/totem/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/totem/session")
    suspend fun validateSession(): Response<SessionResponse>

    @POST("api/totem/checkin")
    suspend fun checkInByFace(@Body request: FaceCheckInRequest): Response<CheckInResponse>

    @POST("api/totem/checkin")
    suspend fun checkInByCode(@Body request: CodeCheckInRequest): Response<CheckInResponse>

    @POST("api/totem/checkin")
    suspend fun checkInByQr(@Body request: QrCheckInRequest): Response<CheckInResponse>

    @POST("api/totem/self-register")
    suspend fun selfRegister(@Body request: SelfRegisterRequest): Response<SelfRegisterResponse>

    @POST("api/totem/print")
    suspend fun printBadge(@Body request: PrintBadgeRequest): Response<PrintBadgeResponse>

    @GET("api/totem/print-config")
    suspend fun getPrintConfig(): Response<PrintConfigResponse>
}
