package com.oneid.totem.presentation.screens.method;

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
public final class MethodViewModel_Factory implements Factory<MethodViewModel> {
  private final Provider<AuthRepository> authRepositoryProvider;

  public MethodViewModel_Factory(Provider<AuthRepository> authRepositoryProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
  }

  @Override
  public MethodViewModel get() {
    return newInstance(authRepositoryProvider.get());
  }

  public static MethodViewModel_Factory create(
      javax.inject.Provider<AuthRepository> authRepositoryProvider) {
    return new MethodViewModel_Factory(Providers.asDaggerProvider(authRepositoryProvider));
  }

  public static MethodViewModel_Factory create(Provider<AuthRepository> authRepositoryProvider) {
    return new MethodViewModel_Factory(authRepositoryProvider);
  }

  public static MethodViewModel newInstance(AuthRepository authRepository) {
    return new MethodViewModel(authRepository);
  }
}
