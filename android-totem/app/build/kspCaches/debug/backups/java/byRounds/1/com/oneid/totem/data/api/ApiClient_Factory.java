package com.oneid.totem.data.api;

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
public final class ApiClient_Factory implements Factory<ApiClient> {
  private final Provider<TokenStorage> tokenStorageProvider;

  public ApiClient_Factory(Provider<TokenStorage> tokenStorageProvider) {
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public ApiClient get() {
    return newInstance(tokenStorageProvider.get());
  }

  public static ApiClient_Factory create(javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new ApiClient_Factory(Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static ApiClient_Factory create(Provider<TokenStorage> tokenStorageProvider) {
    return new ApiClient_Factory(tokenStorageProvider);
  }

  public static ApiClient newInstance(TokenStorage tokenStorage) {
    return new ApiClient(tokenStorage);
  }
}
