package com.oneid.totem.domain.repository

import com.oneid.totem.domain.model.TotemSession

sealed class AuthResult {
    data class Success(val session: TotemSession) : AuthResult()
    data class Error(val code: String, val message: String) : AuthResult()
}

interface AuthRepository {
    suspend fun login(key: String): AuthResult
    suspend fun validateSession(): AuthResult
    suspend fun logout()
    fun isLoggedIn(): Boolean
}
