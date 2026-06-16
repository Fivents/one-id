package com.oneid.totem.data.repository.impl;

import com.oneid.totem.data.db.ActiveEventResolver;
import com.oneid.totem.data.db.CheckInDao;
import com.oneid.totem.data.db.DatabaseManager;
import com.oneid.totem.data.db.FaceDao;
import com.oneid.totem.data.db.SelfRegisterDao;
import com.oneid.totem.data.local.TotemPreferences;
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
public final class CheckInRepositoryImpl_Factory implements Factory<CheckInRepositoryImpl> {
  private final Provider<CheckInDao> checkInDaoProvider;

  private final Provider<FaceDao> faceDaoProvider;

  private final Provider<SelfRegisterDao> selfRegisterDaoProvider;

  private final Provider<ActiveEventResolver> eventResolverProvider;

  private final Provider<DatabaseManager> dbProvider;

  private final Provider<TotemPreferences> prefsProvider;

  public CheckInRepositoryImpl_Factory(Provider<CheckInDao> checkInDaoProvider,
      Provider<FaceDao> faceDaoProvider, Provider<SelfRegisterDao> selfRegisterDaoProvider,
      Provider<ActiveEventResolver> eventResolverProvider, Provider<DatabaseManager> dbProvider,
      Provider<TotemPreferences> prefsProvider) {
    this.checkInDaoProvider = checkInDaoProvider;
    this.faceDaoProvider = faceDaoProvider;
    this.selfRegisterDaoProvider = selfRegisterDaoProvider;
    this.eventResolverProvider = eventResolverProvider;
    this.dbProvider = dbProvider;
    this.prefsProvider = prefsProvider;
  }

  @Override
  public CheckInRepositoryImpl get() {
    return newInstance(checkInDaoProvider.get(), faceDaoProvider.get(), selfRegisterDaoProvider.get(), eventResolverProvider.get(), dbProvider.get(), prefsProvider.get());
  }

  public static CheckInRepositoryImpl_Factory create(
      javax.inject.Provider<CheckInDao> checkInDaoProvider,
      javax.inject.Provider<FaceDao> faceDaoProvider,
      javax.inject.Provider<SelfRegisterDao> selfRegisterDaoProvider,
      javax.inject.Provider<ActiveEventResolver> eventResolverProvider,
      javax.inject.Provider<DatabaseManager> dbProvider,
      javax.inject.Provider<TotemPreferences> prefsProvider) {
    return new CheckInRepositoryImpl_Factory(Providers.asDaggerProvider(checkInDaoProvider), Providers.asDaggerProvider(faceDaoProvider), Providers.asDaggerProvider(selfRegisterDaoProvider), Providers.asDaggerProvider(eventResolverProvider), Providers.asDaggerProvider(dbProvider), Providers.asDaggerProvider(prefsProvider));
  }

  public static CheckInRepositoryImpl_Factory create(Provider<CheckInDao> checkInDaoProvider,
      Provider<FaceDao> faceDaoProvider, Provider<SelfRegisterDao> selfRegisterDaoProvider,
      Provider<ActiveEventResolver> eventResolverProvider, Provider<DatabaseManager> dbProvider,
      Provider<TotemPreferences> prefsProvider) {
    return new CheckInRepositoryImpl_Factory(checkInDaoProvider, faceDaoProvider, selfRegisterDaoProvider, eventResolverProvider, dbProvider, prefsProvider);
  }

  public static CheckInRepositoryImpl newInstance(CheckInDao checkInDao, FaceDao faceDao,
      SelfRegisterDao selfRegisterDao, ActiveEventResolver eventResolver, DatabaseManager db,
      TotemPreferences prefs) {
    return new CheckInRepositoryImpl(checkInDao, faceDao, selfRegisterDao, eventResolver, db, prefs);
  }
}
