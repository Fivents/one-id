package com.oneid.totem.data.print;

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
public final class PrinterConnectionManager_Factory implements Factory<PrinterConnectionManager> {
  private final Provider<BrotherPrinter> printerProvider;

  public PrinterConnectionManager_Factory(Provider<BrotherPrinter> printerProvider) {
    this.printerProvider = printerProvider;
  }

  @Override
  public PrinterConnectionManager get() {
    return newInstance(printerProvider.get());
  }

  public static PrinterConnectionManager_Factory create(
      javax.inject.Provider<BrotherPrinter> printerProvider) {
    return new PrinterConnectionManager_Factory(Providers.asDaggerProvider(printerProvider));
  }

  public static PrinterConnectionManager_Factory create(Provider<BrotherPrinter> printerProvider) {
    return new PrinterConnectionManager_Factory(printerProvider);
  }

  public static PrinterConnectionManager newInstance(BrotherPrinter printer) {
    return new PrinterConnectionManager(printer);
  }
}
