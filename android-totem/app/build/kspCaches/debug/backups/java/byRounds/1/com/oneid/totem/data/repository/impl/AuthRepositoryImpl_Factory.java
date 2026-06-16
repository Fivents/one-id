package com.oneid.totem.data.repository.impl;

import com.oneid.totem.data.api.TotemApi;
import com.oneid.totem.data.local.TokenStorage;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class AuthRepositoryImpl_Factory implements Factory<AuthRepositoryImpl> {
  private final Provider<TotemApi> apiProvider;

  private final Provider<TokenStorage> tokenStorageProvider;

  public AuthRepositoryImpl_Factory(Provider<TotemApi> apiProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    this.apiProvider = apiProvider;
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public AuthRepositoryImpl get() {
    return newInstance(apiProvider.get(), tokenStorageProvider.get());
  }

  public static AuthRepositoryImpl_Factory create(javax.inject.Provider<TotemApi> apiProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new AuthRepositoryImpl_Factory(Providers.asDaggerProvider(apiProvider), Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static AuthRepositoryImpl_Factory create(Provider<TotemApi> apiProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    return new AuthRepositoryImpl_Factory(apiProvider, tokenStorageProvider);
  }

  public static AuthRepositoryImpl newInstance(TotemApi api, TokenStorage tokenStorage) {
    return new AuthRepositoryImpl(api, tokenStorage);
  }
}
