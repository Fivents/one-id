package com.oneid.totem.data.db;

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
public final class CheckInDao_Factory implements Factory<CheckInDao> {
  private final Provider<DatabaseManager> dbProvider;

  public CheckInDao_Factory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public CheckInDao get() {
    return newInstance(dbProvider.get());
  }

  public static CheckInDao_Factory create(javax.inject.Provider<DatabaseManager> dbProvider) {
    return new CheckInDao_Factory(Providers.asDaggerProvider(dbProvider));
  }

  public static CheckInDao_Factory create(Provider<DatabaseManager> dbProvider) {
    return new CheckInDao_Factory(dbProvider);
  }

  public static CheckInDao newInstance(DatabaseManager db) {
    return new CheckInDao(db);
  }
}
