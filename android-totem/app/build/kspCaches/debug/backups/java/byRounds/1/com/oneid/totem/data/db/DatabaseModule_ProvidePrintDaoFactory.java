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
public final class DatabaseModule_ProvidePrintDaoFactory implements Factory<PrintDao> {
  private final Provider<DatabaseManager> dbProvider;

  public DatabaseModule_ProvidePrintDaoFactory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public PrintDao get() {
    return providePrintDao(dbProvider.get());
  }

  public static DatabaseModule_ProvidePrintDaoFactory create(
      javax.inject.Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvidePrintDaoFactory(Providers.asDaggerProvider(dbProvider));
  }

  public static DatabaseModule_ProvidePrintDaoFactory create(Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvidePrintDaoFactory(dbProvider);
  }

  public static PrintDao providePrintDao(DatabaseManager db) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.providePrintDao(db));
  }
}
