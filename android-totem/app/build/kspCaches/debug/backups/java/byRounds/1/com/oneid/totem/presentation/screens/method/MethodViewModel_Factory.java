package com.oneid.totem.presentation.screens.method;

import com.oneid.totem.data.print.PrinterConfigRepository;
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

  private final Provider<PrinterConfigRepository> printerConfigRepositoryProvider;

  public MethodViewModel_Factory(Provider<AuthRepository> authRepositoryProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
    this.printerConfigRepositoryProvider = printerConfigRepositoryProvider;
  }

  @Override
  public MethodViewModel get() {
    return newInstance(authRepositoryProvider.get(), printerConfigRepositoryProvider.get());
  }

  public static MethodViewModel_Factory create(
      javax.inject.Provider<AuthRepository> authRepositoryProvider,
      javax.inject.Provider<PrinterConfigRepository> printerConfigRepositoryProvider) {
    return new MethodViewModel_Factory(Providers.asDaggerProvider(authRepositoryProvider), Providers.asDaggerProvider(printerConfigRepositoryProvider));
  }

  public static MethodViewModel_Factory create(Provider<AuthRepository> authRepositoryProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider) {
    return new MethodViewModel_Factory(authRepositoryProvider, printerConfigRepositoryProvider);
  }

  public static MethodViewModel newInstance(AuthRepository authRepository,
      PrinterConfigRepository printerConfigRepository) {
    return new MethodViewModel(authRepository, printerConfigRepository);
  }
}
