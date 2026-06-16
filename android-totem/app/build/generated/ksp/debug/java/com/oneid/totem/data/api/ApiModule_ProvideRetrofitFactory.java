package com.oneid.totem.data.api;

import com.oneid.totem.data.local.TokenStorage;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import okhttp3.OkHttpClient;
import retrofit2.Retrofit;

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
public final class ApiModule_ProvideRetrofitFactory implements Factory<Retrofit> {
  private final Provider<OkHttpClient> okHttpClientProvider;

  private final Provider<TokenStorage> tokenStorageProvider;

  public ApiModule_ProvideRetrofitFactory(Provider<OkHttpClient> okHttpClientProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    this.okHttpClientProvider = okHttpClientProvider;
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public Retrofit get() {
    return provideRetrofit(okHttpClientProvider.get(), tokenStorageProvider.get());
  }

  public static ApiModule_ProvideRetrofitFactory create(
      javax.inject.Provider<OkHttpClient> okHttpClientProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new ApiModule_ProvideRetrofitFactory(Providers.asDaggerProvider(okHttpClientProvider), Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static ApiModule_ProvideRetrofitFactory create(Provider<OkHttpClient> okHttpClientProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    return new ApiModule_ProvideRetrofitFactory(okHttpClientProvider, tokenStorageProvider);
  }

  public static Retrofit provideRetrofit(OkHttpClient okHttpClient, TokenStorage tokenStorage) {
    return Preconditions.checkNotNullFromProvides(ApiModule.INSTANCE.provideRetrofit(okHttpClient, tokenStorage));
  }
}
