package com.oneid.totem.data.repository.impl;

import com.oneid.totem.data.api.TotemApi;
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
public final class PrintRepositoryImpl_Factory implements Factory<PrintRepositoryImpl> {
  private final Provider<TotemApi> apiProvider;

  public PrintRepositoryImpl_Factory(Provider<TotemApi> apiProvider) {
    this.apiProvider = apiProvider;
  }

  @Override
  public PrintRepositoryImpl get() {
    return newInstance(apiProvider.get());
  }

  public static PrintRepositoryImpl_Factory create(javax.inject.Provider<TotemApi> apiProvider) {
    return new PrintRepositoryImpl_Factory(Providers.asDaggerProvider(apiProvider));
  }

  public static PrintRepositoryImpl_Factory create(Provider<TotemApi> apiProvider) {
    return new PrintRepositoryImpl_Factory(apiProvider);
  }

  public static PrintRepositoryImpl newInstance(TotemApi api) {
    return new PrintRepositoryImpl(api);
  }
}
