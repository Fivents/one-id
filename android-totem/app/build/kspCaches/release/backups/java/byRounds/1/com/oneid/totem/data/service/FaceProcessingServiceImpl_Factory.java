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
public final class FaceProcessingServiceImpl_Factory implements Factory<FaceProcessingServiceImpl> {
  private final Provider<Context> contextProvider;

  private final Provider<ModelDownloader> modelDownloaderProvider;

  public FaceProcessingServiceImpl_Factory(Provider<Context> contextProvider,
      Provider<ModelDownloader> modelDownloaderProvider) {
    this.contextProvider = contextProvider;
    this.modelDownloaderProvider = modelDownloaderProvider;
  }

  @Override
  public FaceProcessingServiceImpl get() {
    return newInstance(contextProvider.get(), modelDownloaderProvider.get());
  }

  public static FaceProcessingServiceImpl_Factory create(
      javax.inject.Provider<Context> contextProvider,
      javax.inject.Provider<ModelDownloader> modelDownloaderProvider) {
    return new FaceProcessingServiceImpl_Factory(Providers.asDaggerProvider(contextProvider), Providers.asDaggerProvider(modelDownloaderProvider));
  }

  public static FaceProcessingServiceImpl_Factory create(Provider<Context> contextProvider,
      Provider<ModelDownloader> modelDownloaderProvider) {
    return new FaceProcessingServiceImpl_Factory(contextProvider, modelDownloaderProvider);
  }

  public static FaceProcessingServiceImpl newInstance(Context context,
      ModelDownloader modelDownloader) {
    return new FaceProcessingServiceImpl(context, modelDownloader);
  }
}
