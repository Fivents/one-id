package com.oneid.totem.data.service;

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
public final class ModelDownloader_Factory implements Factory<ModelDownloader> {
  private final Provider<Context> contextProvider;

  public ModelDownloader_Factory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public ModelDownloader get() {
    return newInstance(contextProvider.get());
  }

  public static ModelDownloader_Factory create(javax.inject.Provider<Context> contextProvider) {
    return new ModelDownloader_Factory(Providers.asDaggerProvider(contextProvider));
  }

  public static ModelDownloader_Factory create(Provider<Context> contextProvider) {
    return new ModelDownloader_Factory(contextProvider);
  }

  public static ModelDownloader newInstance(Context context) {
    return new ModelDownloader(context);
  }
}
