package com.oneid.totem.data.repository.http;

import com.oneid.totem.data.api.ApiClient;
import com.oneid.totem.data.local.TokenStorage;
import com.oneid.totem.data.local.TotemPreferences;
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

  private final Provider<TotemPreferences> totemPreferencesProvider;

  public AuthHttpRepository_Factory(Provider<ApiClient> apiClientProvider,
      Provider<TokenStorage> tokenStorageProvider,
      Provider<TotemPreferences> totemPreferencesProvider) {
    this.apiClientProvider = apiClientProvider;
    this.tokenStorageProvider = tokenStorageProvider;
    this.totemPreferencesProvider = totemPreferencesProvider;
  }

  @Override
  public AuthHttpRepository get() {
    return newInstance(apiClientProvider.get(), tokenStorageProvider.get(), totemPreferencesProvider.get());
  }

  public static AuthHttpRepository_Factory create(
      javax.inject.Provider<ApiClient> apiClientProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider,
      javax.inject.Provider<TotemPreferences> totemPreferencesProvider) {
    return new AuthHttpRepository_Factory(Providers.asDaggerProvider(apiClientProvider), Providers.asDaggerProvider(tokenStorageProvider), Providers.asDaggerProvider(totemPreferencesProvider));
  }

  public static AuthHttpRepository_Factory create(Provider<ApiClient> apiClientProvider,
      Provider<TokenStorage> tokenStorageProvider,
      Provider<TotemPreferences> totemPreferencesProvider) {
    return new AuthHttpRepository_Factory(apiClientProvider, tokenStorageProvider, totemPreferencesProvider);
  }

  public static AuthHttpRepository newInstance(ApiClient apiClient, TokenStorage tokenStorage,
      TotemPreferences totemPreferences) {
    return new AuthHttpRepository(apiClient, tokenStorage, totemPreferences);
  }
}
