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
public final class PrintDao_Factory implements Factory<PrintDao> {
  private final Provider<DatabaseManager> dbProvider;

  public PrintDao_Factory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public PrintDao get() {
    return newInstance(dbProvider.get());
  }

  public static PrintDao_Factory create(javax.inject.Provider<DatabaseManager> dbProvider) {
    return new PrintDao_Factory(Providers.asDaggerProvider(dbProvider));
  }

  public static PrintDao_Factory create(Provider<DatabaseManager> dbProvider) {
    return new PrintDao_Factory(dbProvider);
  }

  public static PrintDao newInstance(DatabaseManager db) {
    return new PrintDao(db);
  }
}
