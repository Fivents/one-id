package com.oneid.totem.data.api;

import com.oneid.totem.data.api.interceptor.AuthInterceptor;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import okhttp3.OkHttpClient;

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
public final class ApiModule_ProvideOkHttpClientFactory implements Factory<OkHttpClient> {
  private final Provider<AuthInterceptor> authInterceptorProvider;

  public ApiModule_ProvideOkHttpClientFactory(Provider<AuthInterceptor> authInterceptorProvider) {
    this.authInterceptorProvider = authInterceptorProvider;
  }

  @Override
  public OkHttpClient get() {
    return provideOkHttpClient(authInterceptorProvider.get());
  }

  public static ApiModule_ProvideOkHttpClientFactory create(
      javax.inject.Provider<AuthInterceptor> authInterceptorProvider) {
    return new ApiModule_ProvideOkHttpClientFactory(Providers.asDaggerProvider(authInterceptorProvider));
  }

  public static ApiModule_ProvideOkHttpClientFactory create(
      Provider<AuthInterceptor> authInterceptorProvider) {
    return new ApiModule_ProvideOkHttpClientFactory(authInterceptorProvider);
  }

  public static OkHttpClient provideOkHttpClient(AuthInterceptor authInterceptor) {
    return Preconditions.checkNotNullFromProvides(ApiModule.INSTANCE.provideOkHttpClient(authInterceptor));
  }
}
