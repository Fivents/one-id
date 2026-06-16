package com.oneid.totem.presentation.screens.login;

import com.oneid.totem.data.local.TokenStorage;
import com.oneid.totem.domain.repository.AuthRepository;
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
public final class LoginViewModel_Factory implements Factory<LoginViewModel> {
  private final Provider<AuthRepository> authRepositoryProvider;

  private final Provider<TokenStorage> tokenStorageProvider;

  public LoginViewModel_Factory(Provider<AuthRepository> authRepositoryProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public LoginViewModel get() {
    return newInstance(authRepositoryProvider.get(), tokenStorageProvider.get());
  }

  public static LoginViewModel_Factory create(
      javax.inject.Provider<AuthRepository> authRepositoryProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new LoginViewModel_Factory(Providers.asDaggerProvider(authRepositoryProvider), Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static LoginViewModel_Factory create(Provider<AuthRepository> authRepositoryProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    return new LoginViewModel_Factory(authRepositoryProvider, tokenStorageProvider);
  }

  public static LoginViewModel newInstance(AuthRepository authRepository,
      TokenStorage tokenStorage) {
    return new LoginViewModel(authRepository, tokenStorage);
  }
}
