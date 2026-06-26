package com.oneid.totem.data.repository.http;

import com.oneid.totem.data.api.ApiClient;
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
public final class CheckInHttpRepository_Factory implements Factory<CheckInHttpRepository> {
  private final Provider<ApiClient> apiClientProvider;

  public CheckInHttpRepository_Factory(Provider<ApiClient> apiClientProvider) {
    this.apiClientProvider = apiClientProvider;
  }

  @Override
  public CheckInHttpRepository get() {
    return newInstance(apiClientProvider.get());
  }

  public static CheckInHttpRepository_Factory create(
      javax.inject.Provider<ApiClient> apiClientProvider) {
    return new CheckInHttpRepository_Factory(Providers.asDaggerProvider(apiClientProvider));
  }

  public static CheckInHttpRepository_Factory create(Provider<ApiClient> apiClientProvider) {
    return new CheckInHttpRepository_Factory(apiClientProvider);
  }

  public static CheckInHttpRepository newInstance(ApiClient apiClient) {
    return new CheckInHttpRepository(apiClient);
  }
}
