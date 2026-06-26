package com.oneid.totem;

import com.oneid.totem.data.service.ModelDownloader;
import dagger.MembersInjector;
import dagger.internal.DaggerGenerated;
import dagger.internal.InjectedFieldSignature;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import javax.annotation.processing.Generated;

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
public final class OneIdApp_MembersInjector implements MembersInjector<OneIdApp> {
  private final Provider<ModelDownloader> modelDownloaderProvider;

  public OneIdApp_MembersInjector(Provider<ModelDownloader> modelDownloaderProvider) {
    this.modelDownloaderProvider = modelDownloaderProvider;
  }

  public static MembersInjector<OneIdApp> create(
      Provider<ModelDownloader> modelDownloaderProvider) {
    return new OneIdApp_MembersInjector(modelDownloaderProvider);
  }

  public static MembersInjector<OneIdApp> create(
      javax.inject.Provider<ModelDownloader> modelDownloaderProvider) {
    return new OneIdApp_MembersInjector(Providers.asDaggerProvider(modelDownloaderProvider));
  }

  @Override
  public void injectMembers(OneIdApp instance) {
    injectModelDownloader(instance, modelDownloaderProvider.get());
  }

  @InjectedFieldSignature("com.oneid.totem.OneIdApp.modelDownloader")
  public static void injectModelDownloader(OneIdApp instance, ModelDownloader modelDownloader) {
    instance.modelDownloader = modelDownloader;
  }
}
