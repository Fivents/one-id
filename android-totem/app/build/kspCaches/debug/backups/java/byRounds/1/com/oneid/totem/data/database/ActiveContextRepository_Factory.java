package com.oneid.totem.data.database;

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
public final class ActiveContextRepository_Factory implements Factory<ActiveContextRepository> {
  private final Provider<DatabaseDataSource> dbProvider;

  public ActiveContextRepository_Factory(Provider<DatabaseDataSource> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public ActiveContextRepository get() {
    return newInstance(dbProvider.get());
  }

  public static ActiveContextRepository_Factory create(
      javax.inject.Provider<DatabaseDataSource> dbProvider) {
    return new ActiveContextRepository_Factory(Providers.asDaggerProvider(dbProvider));
  }

  public static ActiveContextRepository_Factory create(Provider<DatabaseDataSource> dbProvider) {
    return new ActiveContextRepository_Factory(dbProvider);
  }

  public static ActiveContextRepository newInstance(DatabaseDataSource db) {
    return new ActiveContextRepository(db);
  }
}
