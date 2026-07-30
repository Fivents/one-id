package com.oneid.totem.data.print;

import com.oneid.totem.data.local.TokenStorage;
import com.oneid.totem.data.local.TotemPreferences;
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

  private final Provider<TotemPreferences> prefsProvider;

  public PrinterConfigRepository_Factory(Provider<TokenStorage> tokenStorageProvider,
      Provider<TotemPreferences> prefsProvider) {
    this.tokenStorageProvider = tokenStorageProvider;
    this.prefsProvider = prefsProvider;
  }

  @Override
  public PrinterConfigRepository get() {
    return newInstance(tokenStorageProvider.get(), prefsProvider.get());
  }

  public static PrinterConfigRepository_Factory create(
      javax.inject.Provider<TokenStorage> tokenStorageProvider,
      javax.inject.Provider<TotemPreferences> prefsProvider) {
    return new PrinterConfigRepository_Factory(Providers.asDaggerProvider(tokenStorageProvider), Providers.asDaggerProvider(prefsProvider));
  }

  public static PrinterConfigRepository_Factory create(Provider<TokenStorage> tokenStorageProvider,
      Provider<TotemPreferences> prefsProvider) {
    return new PrinterConfigRepository_Factory(tokenStorageProvider, prefsProvider);
  }

  public static PrinterConfigRepository newInstance(TokenStorage tokenStorage,
      TotemPreferences prefs) {
    return new PrinterConfigRepository(tokenStorage, prefs);
  }
}
