package com.oneid.totem.data.print;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
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
public final class PrinterConfigModule_ProvidePrinterConnectionManagerFactory implements Factory<PrinterConnectionManager> {
  private final Provider<BrotherPrinter> printerProvider;

  public PrinterConfigModule_ProvidePrinterConnectionManagerFactory(
      Provider<BrotherPrinter> printerProvider) {
    this.printerProvider = printerProvider;
  }

  @Override
  public PrinterConnectionManager get() {
    return providePrinterConnectionManager(printerProvider.get());
  }

  public static PrinterConfigModule_ProvidePrinterConnectionManagerFactory create(
      javax.inject.Provider<BrotherPrinter> printerProvider) {
    return new PrinterConfigModule_ProvidePrinterConnectionManagerFactory(Providers.asDaggerProvider(printerProvider));
  }

  public static PrinterConfigModule_ProvidePrinterConnectionManagerFactory create(
      Provider<BrotherPrinter> printerProvider) {
    return new PrinterConfigModule_ProvidePrinterConnectionManagerFactory(printerProvider);
  }

  public static PrinterConnectionManager providePrinterConnectionManager(BrotherPrinter printer) {
    return Preconditions.checkNotNullFromProvides(PrinterConfigModule.INSTANCE.providePrinterConnectionManager(printer));
  }
}
