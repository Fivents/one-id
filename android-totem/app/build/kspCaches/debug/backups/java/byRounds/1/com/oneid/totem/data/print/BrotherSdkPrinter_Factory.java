package com.oneid.totem.data.print;

import android.content.Context;
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
public final class BrotherSdkPrinter_Factory implements Factory<BrotherSdkPrinter> {
  private final Provider<Context> appContextProvider;

  public BrotherSdkPrinter_Factory(Provider<Context> appContextProvider) {
    this.appContextProvider = appContextProvider;
  }

  @Override
  public BrotherSdkPrinter get() {
    return newInstance(appContextProvider.get());
  }

  public static BrotherSdkPrinter_Factory create(
      javax.inject.Provider<Context> appContextProvider) {
    return new BrotherSdkPrinter_Factory(Providers.asDaggerProvider(appContextProvider));
  }

  public static BrotherSdkPrinter_Factory create(Provider<Context> appContextProvider) {
    return new BrotherSdkPrinter_Factory(appContextProvider);
  }

  public static BrotherSdkPrinter newInstance(Context appContext) {
    return new BrotherSdkPrinter(appContext);
  }
}
