package com.oneid.totem;

import com.oneid.totem.data.db.DatabaseManager;
import com.oneid.totem.data.local.TotemPreferences;
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
  private final Provider<DatabaseManager> databaseManagerProvider;

  private final Provider<TotemPreferences> prefsProvider;

  private final Provider<ModelDownloader> modelDownloaderProvider;

  public OneIdApp_MembersInjector(Provider<DatabaseManager> databaseManagerProvider,
      Provider<TotemPreferences> prefsProvider, Provider<ModelDownloader> modelDownloaderProvider) {
    this.databaseManagerProvider = databaseManagerProvider;
    this.prefsProvider = prefsProvider;
    this.modelDownloaderProvider = modelDownloaderProvider;
  }

  public static MembersInjector<OneIdApp> create(Provider<DatabaseManager> databaseManagerProvider,
      Provider<TotemPreferences> prefsProvider, Provider<ModelDownloader> modelDownloaderProvider) {
    return new OneIdApp_MembersInjector(databaseManagerProvider, prefsProvider, modelDownloaderProvider);
  }

  public static MembersInjector<OneIdApp> create(
      javax.inject.Provider<DatabaseManager> databaseManagerProvider,
      javax.inject.Provider<TotemPreferences> prefsProvider,
      javax.inject.Provider<ModelDownloader> modelDownloaderProvider) {
    return new OneIdApp_MembersInjector(Providers.asDaggerProvider(databaseManagerProvider), Providers.asDaggerProvider(prefsProvider), Providers.asDaggerProvider(modelDownloaderProvider));
  }

  @Override
  public void injectMembers(OneIdApp instance) {
    injectDatabaseManager(instance, databaseManagerProvider.get());
    injectPrefs(instance, prefsProvider.get());
    injectModelDownloader(instance, modelDownloaderProvider.get());
  }

  @InjectedFieldSignature("com.oneid.totem.OneIdApp.databaseManager")
  public static void injectDatabaseManager(OneIdApp instance, DatabaseManager databaseManager) {
    instance.databaseManager = databaseManager;
  }

  @InjectedFieldSignature("com.oneid.totem.OneIdApp.prefs")
  public static void injectPrefs(OneIdApp instance, TotemPreferences prefs) {
    instance.prefs = prefs;
  }

  @InjectedFieldSignature("com.oneid.totem.OneIdApp.modelDownloader")
  public static void injectModelDownloader(OneIdApp instance, ModelDownloader modelDownloader) {
    instance.modelDownloader = modelDownloader;
  }
}
