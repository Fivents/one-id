package com.oneid.totem.data.repository.impl;

import com.oneid.totem.data.db.DatabaseManager;
import com.oneid.totem.data.db.PrintDao;
import com.oneid.totem.data.local.TotemPreferences;
import com.oneid.totem.data.print.LocalBadgeHtmlRenderer;
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
public final class PrintRepositoryImpl_Factory implements Factory<PrintRepositoryImpl> {
  private final Provider<PrintDao> printDaoProvider;

  private final Provider<LocalBadgeHtmlRenderer> badgeRendererProvider;

  private final Provider<DatabaseManager> dbProvider;

  private final Provider<TotemPreferences> prefsProvider;

  public PrintRepositoryImpl_Factory(Provider<PrintDao> printDaoProvider,
      Provider<LocalBadgeHtmlRenderer> badgeRendererProvider, Provider<DatabaseManager> dbProvider,
      Provider<TotemPreferences> prefsProvider) {
    this.printDaoProvider = printDaoProvider;
    this.badgeRendererProvider = badgeRendererProvider;
    this.dbProvider = dbProvider;
    this.prefsProvider = prefsProvider;
  }

  @Override
  public PrintRepositoryImpl get() {
    return newInstance(printDaoProvider.get(), badgeRendererProvider.get(), dbProvider.get(), prefsProvider.get());
  }

  public static PrintRepositoryImpl_Factory create(javax.inject.Provider<PrintDao> printDaoProvider,
      javax.inject.Provider<LocalBadgeHtmlRenderer> badgeRendererProvider,
      javax.inject.Provider<DatabaseManager> dbProvider,
      javax.inject.Provider<TotemPreferences> prefsProvider) {
    return new PrintRepositoryImpl_Factory(Providers.asDaggerProvider(printDaoProvider), Providers.asDaggerProvider(badgeRendererProvider), Providers.asDaggerProvider(dbProvider), Providers.asDaggerProvider(prefsProvider));
  }

  public static PrintRepositoryImpl_Factory create(Provider<PrintDao> printDaoProvider,
      Provider<LocalBadgeHtmlRenderer> badgeRendererProvider, Provider<DatabaseManager> dbProvider,
      Provider<TotemPreferences> prefsProvider) {
    return new PrintRepositoryImpl_Factory(printDaoProvider, badgeRendererProvider, dbProvider, prefsProvider);
  }

  public static PrintRepositoryImpl newInstance(PrintDao printDao,
      LocalBadgeHtmlRenderer badgeRenderer, DatabaseManager db, TotemPreferences prefs) {
    return new PrintRepositoryImpl(printDao, badgeRenderer, db, prefs);
  }
}
