package com.oneid.totem.data.db;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
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
public final class DatabaseModule_ProvideFaceDaoFactory implements Factory<FaceDao> {
  private final Provider<DatabaseManager> dbProvider;

  public DatabaseModule_ProvideFaceDaoFactory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public FaceDao get() {
    return provideFaceDao(dbProvider.get());
  }

  public static DatabaseModule_ProvideFaceDaoFactory create(
      javax.inject.Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvideFaceDaoFactory(Providers.asDaggerProvider(dbProvider));
  }

  public static DatabaseModule_ProvideFaceDaoFactory create(Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvideFaceDaoFactory(dbProvider);
  }

  public static FaceDao provideFaceDao(DatabaseManager db) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideFaceDao(db));
  }
}
