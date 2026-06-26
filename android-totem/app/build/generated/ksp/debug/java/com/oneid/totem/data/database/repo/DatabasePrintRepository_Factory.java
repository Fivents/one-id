package com.oneid.totem.data.database.repo;

import com.oneid.totem.data.database.DatabaseDataSource;
import com.oneid.totem.data.local.TokenStorage;
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
public final class DatabasePrintRepository_Factory implements Factory<DatabasePrintRepository> {
  private final Provider<DatabaseDataSource> dbProvider;

  private final Provider<TokenStorage> tokenStorageProvider;

  public DatabasePrintRepository_Factory(Provider<DatabaseDataSource> dbProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    this.dbProvider = dbProvider;
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public DatabasePrintRepository get() {
    return newInstance(dbProvider.get(), tokenStorageProvider.get());
  }

  public static DatabasePrintRepository_Factory create(
      javax.inject.Provider<DatabaseDataSource> dbProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new DatabasePrintRepository_Factory(Providers.asDaggerProvider(dbProvider), Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static DatabasePrintRepository_Factory create(Provider<DatabaseDataSource> dbProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    return new DatabasePrintRepository_Factory(dbProvider, tokenStorageProvider);
  }

  public static DatabasePrintRepository newInstance(DatabaseDataSource db,
      TokenStorage tokenStorage) {
    return new DatabasePrintRepository(db, tokenStorage);
  }
}
