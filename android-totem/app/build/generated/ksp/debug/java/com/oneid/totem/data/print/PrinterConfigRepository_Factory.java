package com.oneid.totem.data.print;

import com.oneid.totem.data.local.TokenStorage;
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
public final class PrinterConfigRepository_Factory implements Factory<PrinterConfigRepository> {
  private final Provider<TokenStorage> tokenStorageProvider;

  public PrinterConfigRepository_Factory(Provider<TokenStorage> tokenStorageProvider) {
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public PrinterConfigRepository get() {
    return newInstance(tokenStorageProvider.get());
  }

  public static PrinterConfigRepository_Factory create(
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new PrinterConfigRepository_Factory(Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static PrinterConfigRepository_Factory create(
      Provider<TokenStorage> tokenStorageProvider) {
    return new PrinterConfigRepository_Factory(tokenStorageProvider);
  }

  public static PrinterConfigRepository newInstance(TokenStorage tokenStorage) {
    return new PrinterConfigRepository(tokenStorage);
  }
}
