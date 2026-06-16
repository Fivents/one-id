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
public final class CheckInRepositoryImpl_Factory implements Factory<CheckInRepositoryImpl> {
  private final Provider<TotemApi> apiProvider;

  public CheckInRepositoryImpl_Factory(Provider<TotemApi> apiProvider) {
    this.apiProvider = apiProvider;
  }

  @Override
  public CheckInRepositoryImpl get() {
    return newInstance(apiProvider.get());
  }

  public static CheckInRepositoryImpl_Factory create(javax.inject.Provider<TotemApi> apiProvider) {
    return new CheckInRepositoryImpl_Factory(Providers.asDaggerProvider(apiProvider));
  }

  public static CheckInRepositoryImpl_Factory create(Provider<TotemApi> apiProvider) {
    return new CheckInRepositoryImpl_Factory(apiProvider);
  }

  public static CheckInRepositoryImpl newInstance(TotemApi api) {
    return new CheckInRepositoryImpl(api);
  }
}
