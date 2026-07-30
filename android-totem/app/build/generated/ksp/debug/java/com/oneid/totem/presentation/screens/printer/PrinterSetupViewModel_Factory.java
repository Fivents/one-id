package com.oneid.totem.presentation.screens.printer;

import android.content.Context;
import com.oneid.totem.data.print.BadgeRenderer;
import com.oneid.totem.data.print.PrinterConfigRepository;
import com.oneid.totem.data.print.PrinterConnectionManager;
import com.oneid.totem.domain.repository.PrintRepository;
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
public final class PrinterSetupViewModel_Factory implements Factory<PrinterSetupViewModel> {
  private final Provider<Context> appContextProvider;

  private final Provider<PrinterConfigRepository> printerConfigRepositoryProvider;

  private final Provider<PrinterConnectionManager> printerConnectionManagerProvider;

  private final Provider<BadgeRenderer> badgeRendererProvider;

  private final Provider<PrintRepository> printRepositoryProvider;

  public PrinterSetupViewModel_Factory(Provider<Context> appContextProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<PrinterConnectionManager> printerConnectionManagerProvider,
      Provider<BadgeRenderer> badgeRendererProvider,
      Provider<PrintRepository> printRepositoryProvider) {
    this.appContextProvider = appContextProvider;
    this.printerConfigRepositoryProvider = printerConfigRepositoryProvider;
    this.printerConnectionManagerProvider = printerConnectionManagerProvider;
    this.badgeRendererProvider = badgeRendererProvider;
    this.printRepositoryProvider = printRepositoryProvider;
  }

  @Override
  public PrinterSetupViewModel get() {
    return newInstance(appContextProvider.get(), printerConfigRepositoryProvider.get(), printerConnectionManagerProvider.get(), badgeRendererProvider.get(), printRepositoryProvider.get());
  }

  public static PrinterSetupViewModel_Factory create(
      javax.inject.Provider<Context> appContextProvider,
      javax.inject.Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      javax.inject.Provider<PrinterConnectionManager> printerConnectionManagerProvider,
      javax.inject.Provider<BadgeRenderer> badgeRendererProvider,
      javax.inject.Provider<PrintRepository> printRepositoryProvider) {
    return new PrinterSetupViewModel_Factory(Providers.asDaggerProvider(appContextProvider), Providers.asDaggerProvider(printerConfigRepositoryProvider), Providers.asDaggerProvider(printerConnectionManagerProvider), Providers.asDaggerProvider(badgeRendererProvider), Providers.asDaggerProvider(printRepositoryProvider));
  }

  public static PrinterSetupViewModel_Factory create(Provider<Context> appContextProvider,
      Provider<PrinterConfigRepository> printerConfigRepositoryProvider,
      Provider<PrinterConnectionManager> printerConnectionManagerProvider,
      Provider<BadgeRenderer> badgeRendererProvider,
      Provider<PrintRepository> printRepositoryProvider) {
    return new PrinterSetupViewModel_Factory(appContextProvider, printerConfigRepositoryProvider, printerConnectionManagerProvider, badgeRendererProvider, printRepositoryProvider);
  }

  public static PrinterSetupViewModel newInstance(Context appContext,
      PrinterConfigRepository printerConfigRepository,
      PrinterConnectionManager printerConnectionManager, BadgeRenderer badgeRenderer,
      PrintRepository printRepository) {
    return new PrinterSetupViewModel(appContext, printerConfigRepository, printerConnectionManager, badgeRenderer, printRepository);
  }
}
