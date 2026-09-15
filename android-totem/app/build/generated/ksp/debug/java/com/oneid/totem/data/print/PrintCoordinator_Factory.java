package com.oneid.totem.data.print;

import android.content.Context;
import com.oneid.totem.domain.repository.PrintRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
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
public final class PrintCoordinator_Factory implements Factory<PrintCoordinator> {
  private final Provider<Context> appContextProvider;

  private final Provider<PrintRepository> printRepositoryProvider;

  private final Provider<BadgeRenderer> badgeRendererProvider;

  private final Provider<PrinterConfigRepository> printerConfigRepositoryProvider;

  private final Provider<PrinterConnectionManager> connectionManagerProvider;

  private final Provider<UsbPrinterDiscovery> usbPrinterDiscoveryProvider;

  public PrintCoordinator_Factory(Provider<Context> appContextProvider,
      Provider<PrintRepository> printRepositoryProvider,
      Provider<BadgeRenderer> badgeRendererProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<PrinterConnectionManager> connectionManagerProvider,
      Provider<UsbPrinterDiscovery> usbPrinterDiscoveryProvider) {
    this.appContextProvider = appContextProvider;
    this.printRepositoryProvider = printRepositoryProvider;
    this.badgeRendererProvider = badgeRendererProvider;
    this.printerConfigRepositoryProvider = printerConfigRepositoryProvider;
    this.connectionManagerProvider = connectionManagerProvider;
    this.usbPrinterDiscoveryProvider = usbPrinterDiscoveryProvider;
  }

  @Override
  public PrintCoordinator get() {
    return newInstance(appContextProvider.get(), printRepositoryProvider.get(), badgeRendererProvider.get(), printerConfigRepositoryProvider.get(), connectionManagerProvider.get(), usbPrinterDiscoveryProvider.get());
  }

  public static PrintCoordinator_Factory create(javax.inject.Provider<Context> appContextProvider,
      javax.inject.Provider<PrintRepository> printRepositoryProvider,
      javax.inject.Provider<BadgeRenderer> badgeRendererProvider,
      javax.inject.Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      javax.inject.Provider<PrinterConnectionManager> connectionManagerProvider,
      javax.inject.Provider<UsbPrinterDiscovery> usbPrinterDiscoveryProvider) {
    return new PrintCoordinator_Factory(Providers.asDaggerProvider(appContextProvider), Providers.asDaggerProvider(printRepositoryProvider), Providers.asDaggerProvider(badgeRendererProvider), Providers.asDaggerProvider(printerConfigRepositoryProvider), Providers.asDaggerProvider(connectionManagerProvider), Providers.asDaggerProvider(usbPrinterDiscoveryProvider));
  }

  public static PrintCoordinator_Factory create(Provider<Context> appContextProvider,
      Provider<PrintRepository> printRepositoryProvider,
      Provider<BadgeRenderer> badgeRendererProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<PrinterConnectionManager> connectionManagerProvider,
      Provider<UsbPrinterDiscovery> usbPrinterDiscoveryProvider) {
    return new PrintCoordinator_Factory(appContextProvider, printRepositoryProvider, badgeRendererProvider, printerConfigRepositoryProvider, connectionManagerProvider, usbPrinterDiscoveryProvider);
  }

  public static PrintCoordinator newInstance(Context appContext, PrintRepository printRepository,
      BadgeRenderer badgeRenderer, PrinterConfigRepository printerConfigRepository,
      PrinterConnectionManager connectionManager, UsbPrinterDiscovery usbPrinterDiscovery) {
    return new PrintCoordinator(appContext, printRepository, badgeRenderer, printerConfigRepository, connectionManager, usbPrinterDiscovery);
  }
}
