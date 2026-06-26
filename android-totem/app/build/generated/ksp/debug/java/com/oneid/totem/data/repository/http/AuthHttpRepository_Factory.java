package com.oneid.totem.data.repository.http;

import com.oneid.totem.data.api.ApiClient;
import com.oneid.totem.data.local.TokenStorage;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
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
public final class AuthHttpRepository_Factory implements Factory<AuthHttpRepository> {
  private final Provider<ApiClient> apiClientProvider;

  private final Provider<TokenStorage> tokenStorageProvider;

  public AuthHttpRepository_Factory(Provider<ApiClient> apiClientProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    this.apiClientProvider = apiClientProvider;
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public AuthHttpRepository get() {
    return newInstance(apiClientProvider.get(), tokenStorageProvider.get());
  }

  public static AuthHttpRepository_Factory create(
      javax.inject.Provider<ApiClient> apiClientProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new AuthHttpRepository_Factory(Providers.asDaggerProvider(apiClientProvider), Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static AuthHttpRepository_Factory create(Provider<ApiClient> apiClientProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    return new AuthHttpRepository_Factory(apiClientProvider, tokenStorageProvider);
  }

  public static AuthHttpRepository newInstance(ApiClient apiClient, TokenStorage tokenStorage) {
    return new AuthHttpRepository(apiClient, tokenStorage);
  }
}
