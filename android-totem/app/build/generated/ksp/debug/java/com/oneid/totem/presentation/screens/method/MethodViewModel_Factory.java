package com.oneid.totem.presentation.screens.method;

import com.oneid.totem.data.print.PrinterConfigRepository;
import com.oneid.totem.data.service.ModelDownloader;
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

  private final Provider<ModelDownloader> modelDownloaderProvider;

  public MethodViewModel_Factory(Provider<AuthRepository> authRepositoryProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<ModelDownloader> modelDownloaderProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
    this.printerConfigRepositoryProvider = printerConfigRepositoryProvider;
    this.modelDownloaderProvider = modelDownloaderProvider;
  }

  @Override
  public MethodViewModel get() {
    return newInstance(authRepositoryProvider.get(), printerConfigRepositoryProvider.get(), modelDownloaderProvider.get());
  }

  public static MethodViewModel_Factory create(
      javax.inject.Provider<AuthRepository> authRepositoryProvider,
      javax.inject.Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      javax.inject.Provider<ModelDownloader> modelDownloaderProvider) {
    return new MethodViewModel_Factory(Providers.asDaggerProvider(authRepositoryProvider), Providers.asDaggerProvider(printerConfigRepositoryProvider), Providers.asDaggerProvider(modelDownloaderProvider));
  }

  public static MethodViewModel_Factory create(Provider<AuthRepository> authRepositoryProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<ModelDownloader> modelDownloaderProvider) {
    return new MethodViewModel_Factory(authRepositoryProvider, printerConfigRepositoryProvider, modelDownloaderProvider);
  }

  public static MethodViewModel newInstance(AuthRepository authRepository,
      PrinterConfigRepository printerConfigRepository, ModelDownloader modelDownloader) {
    return new MethodViewModel(authRepository, printerConfigRepository, modelDownloader);
  }
}
