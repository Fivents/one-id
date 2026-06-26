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
public final class PrintHttpRepository_Factory implements Factory<PrintHttpRepository> {
  private final Provider<ApiClient> apiClientProvider;

  public PrintHttpRepository_Factory(Provider<ApiClient> apiClientProvider) {
    this.apiClientProvider = apiClientProvider;
  }

  @Override
  public PrintHttpRepository get() {
    return newInstance(apiClientProvider.get());
  }

  public static PrintHttpRepository_Factory create(
      javax.inject.Provider<ApiClient> apiClientProvider) {
    return new PrintHttpRepository_Factory(Providers.asDaggerProvider(apiClientProvider));
  }

  public static PrintHttpRepository_Factory create(Provider<ApiClient> apiClientProvider) {
    return new PrintHttpRepository_Factory(apiClientProvider);
  }

  public static PrintHttpRepository newInstance(ApiClient apiClient) {
    return new PrintHttpRepository(apiClient);
  }
}
