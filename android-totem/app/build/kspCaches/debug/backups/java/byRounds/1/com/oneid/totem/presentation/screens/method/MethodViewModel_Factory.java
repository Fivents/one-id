package com.oneid.totem.presentation.screens.method;

import android.content.Context;
import com.oneid.totem.data.local.TotemPreferences;
import com.oneid.totem.data.print.PrinterConfigRepository;
import com.oneid.totem.data.print.PrinterConnectionManager;
import com.oneid.totem.data.print.UsbPrinterDiscovery;
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
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
  private final Provider<Context> appContextProvider;

  private final Provider<AuthRepository> authRepositoryProvider;

  private final Provider<PrinterConfigRepository> printerConfigRepositoryProvider;

  private final Provider<PrinterConnectionManager> printerConnectionManagerProvider;

  private final Provider<UsbPrinterDiscovery> usbPrinterDiscoveryProvider;

  private final Provider<ModelDownloader> modelDownloaderProvider;

  private final Provider<TotemPreferences> totemPreferencesProvider;

  public MethodViewModel_Factory(Provider<Context> appContextProvider,
      Provider<AuthRepository> authRepositoryProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<PrinterConnectionManager> printerConnectionManagerProvider,
      Provider<UsbPrinterDiscovery> usbPrinterDiscoveryProvider,
      Provider<ModelDownloader> modelDownloaderProvider,
      Provider<TotemPreferences> totemPreferencesProvider) {
    this.appContextProvider = appContextProvider;
    this.authRepositoryProvider = authRepositoryProvider;
    this.printerConfigRepositoryProvider = printerConfigRepositoryProvider;
    this.printerConnectionManagerProvider = printerConnectionManagerProvider;
    this.usbPrinterDiscoveryProvider = usbPrinterDiscoveryProvider;
    this.modelDownloaderProvider = modelDownloaderProvider;
    this.totemPreferencesProvider = totemPreferencesProvider;
  }

  @Override
  public MethodViewModel get() {
    return newInstance(appContextProvider.get(), authRepositoryProvider.get(), printerConfigRepositoryProvider.get(), printerConnectionManagerProvider.get(), usbPrinterDiscoveryProvider.get(), modelDownloaderProvider.get(), totemPreferencesProvider.get());
  }

  public static MethodViewModel_Factory create(javax.inject.Provider<Context> appContextProvider,
      javax.inject.Provider<AuthRepository> authRepositoryProvider,
      javax.inject.Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      javax.inject.Provider<PrinterConnectionManager> printerConnectionManagerProvider,
      javax.inject.Provider<UsbPrinterDiscovery> usbPrinterDiscoveryProvider,
      javax.inject.Provider<ModelDownloader> modelDownloaderProvider,
      javax.inject.Provider<TotemPreferences> totemPreferencesProvider) {
    return new MethodViewModel_Factory(Providers.asDaggerProvider(appContextProvider), Providers.asDaggerProvider(authRepositoryProvider), Providers.asDaggerProvider(printerConfigRepositoryProvider), Providers.asDaggerProvider(printerConnectionManagerProvider), Providers.asDaggerProvider(usbPrinterDiscoveryProvider), Providers.asDaggerProvider(modelDownloaderProvider), Providers.asDaggerProvider(totemPreferencesProvider));
  }

  public static MethodViewModel_Factory create(Provider<Context> appContextProvider,
      Provider<AuthRepository> authRepositoryProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<PrinterConnectionManager> printerConnectionManagerProvider,
      Provider<UsbPrinterDiscovery> usbPrinterDiscoveryProvider,
      Provider<ModelDownloader> modelDownloaderProvider,
      Provider<TotemPreferences> totemPreferencesProvider) {
    return new MethodViewModel_Factory(appContextProvider, authRepositoryProvider, printerConfigRepositoryProvider, printerConnectionManagerProvider, usbPrinterDiscoveryProvider, modelDownloaderProvider, totemPreferencesProvider);
  }

  public static MethodViewModel newInstance(Context appContext, AuthRepository authRepository,
      PrinterConfigRepository printerConfigRepository,
      PrinterConnectionManager printerConnectionManager, UsbPrinterDiscovery usbPrinterDiscovery,
      ModelDownloader modelDownloader, TotemPreferences totemPreferences) {
    return new MethodViewModel(appContext, authRepository, printerConfigRepository, printerConnectionManager, usbPrinterDiscovery, modelDownloader, totemPreferences);
  }
}
