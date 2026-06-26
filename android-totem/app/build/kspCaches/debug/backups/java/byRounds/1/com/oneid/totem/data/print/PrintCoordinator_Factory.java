package com.oneid.totem.data.print;

import com.oneid.totem.domain.repository.PrintRepository;
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
public final class PrintCoordinator_Factory implements Factory<PrintCoordinator> {
  private final Provider<PrintRepository> printRepositoryProvider;

  private final Provider<BadgeRenderer> badgeRendererProvider;

  private final Provider<PrinterConfigRepository> printerConfigRepositoryProvider;

  private final Provider<PrinterConnectionManager> connectionManagerProvider;

  public PrintCoordinator_Factory(Provider<PrintRepository> printRepositoryProvider,
      Provider<BadgeRenderer> badgeRendererProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<PrinterConnectionManager> connectionManagerProvider) {
    this.printRepositoryProvider = printRepositoryProvider;
    this.badgeRendererProvider = badgeRendererProvider;
    this.printerConfigRepositoryProvider = printerConfigRepositoryProvider;
    this.connectionManagerProvider = connectionManagerProvider;
  }

  @Override
  public PrintCoordinator get() {
    return newInstance(printRepositoryProvider.get(), badgeRendererProvider.get(), printerConfigRepositoryProvider.get(), connectionManagerProvider.get());
  }

  public static PrintCoordinator_Factory create(
      javax.inject.Provider<PrintRepository> printRepositoryProvider,
      javax.inject.Provider<BadgeRenderer> badgeRendererProvider,
      javax.inject.Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      javax.inject.Provider<PrinterConnectionManager> connectionManagerProvider) {
    return new PrintCoordinator_Factory(Providers.asDaggerProvider(printRepositoryProvider), Providers.asDaggerProvider(badgeRendererProvider), Providers.asDaggerProvider(printerConfigRepositoryProvider), Providers.asDaggerProvider(connectionManagerProvider));
  }

  public static PrintCoordinator_Factory create(Provider<PrintRepository> printRepositoryProvider,
      Provider<BadgeRenderer> badgeRendererProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<PrinterConnectionManager> connectionManagerProvider) {
    return new PrintCoordinator_Factory(printRepositoryProvider, badgeRendererProvider, printerConfigRepositoryProvider, connectionManagerProvider);
  }

  public static PrintCoordinator newInstance(PrintRepository printRepository,
      BadgeRenderer badgeRenderer, PrinterConfigRepository printerConfigRepository,
      PrinterConnectionManager connectionManager) {
    return new PrintCoordinator(printRepository, badgeRenderer, printerConfigRepository, connectionManager);
  }
}
