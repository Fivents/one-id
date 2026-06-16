package com.oneid.totem.data.api;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
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
public final class ApiModule_ProvideTotemApiFactory implements Factory<TotemApi> {
  private final Provider<Retrofit> retrofitProvider;

  public ApiModule_ProvideTotemApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public TotemApi get() {
    return provideTotemApi(retrofitProvider.get());
  }

  public static ApiModule_ProvideTotemApiFactory create(
      javax.inject.Provider<Retrofit> retrofitProvider) {
    return new ApiModule_ProvideTotemApiFactory(Providers.asDaggerProvider(retrofitProvider));
  }

  public static ApiModule_ProvideTotemApiFactory create(Provider<Retrofit> retrofitProvider) {
    return new ApiModule_ProvideTotemApiFactory(retrofitProvider);
  }

  public static TotemApi provideTotemApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(ApiModule.INSTANCE.provideTotemApi(retrofit));
  }
}
