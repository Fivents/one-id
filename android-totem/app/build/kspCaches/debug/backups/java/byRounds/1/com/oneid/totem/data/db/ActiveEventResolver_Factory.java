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
public final class ActiveEventResolver_Factory implements Factory<ActiveEventResolver> {
  private final Provider<DatabaseManager> dbProvider;

  public ActiveEventResolver_Factory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public ActiveEventResolver get() {
    return newInstance(dbProvider.get());
  }

  public static ActiveEventResolver_Factory create(
      javax.inject.Provider<DatabaseManager> dbProvider) {
    return new ActiveEventResolver_Factory(Providers.asDaggerProvider(dbProvider));
  }

  public static ActiveEventResolver_Factory create(Provider<DatabaseManager> dbProvider) {
    return new ActiveEventResolver_Factory(dbProvider);
  }

  public static ActiveEventResolver newInstance(DatabaseManager db) {
    return new ActiveEventResolver(db);
  }
}
