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
public final class DatabaseModule_ProvideCheckInDaoFactory implements Factory<CheckInDao> {
  private final Provider<DatabaseManager> dbProvider;

  public DatabaseModule_ProvideCheckInDaoFactory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public CheckInDao get() {
    return provideCheckInDao(dbProvider.get());
  }

  public static DatabaseModule_ProvideCheckInDaoFactory create(
      javax.inject.Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvideCheckInDaoFactory(Providers.asDaggerProvider(dbProvider));
  }

  public static DatabaseModule_ProvideCheckInDaoFactory create(
      Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvideCheckInDaoFactory(dbProvider);
  }

  public static CheckInDao provideCheckInDao(DatabaseManager db) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideCheckInDao(db));
  }
}
