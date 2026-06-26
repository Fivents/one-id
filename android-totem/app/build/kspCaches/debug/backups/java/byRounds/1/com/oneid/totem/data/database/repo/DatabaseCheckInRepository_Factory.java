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
public final class DatabaseCheckInRepository_Factory implements Factory<DatabaseCheckInRepository> {
  private final Provider<DatabaseDataSource> dbProvider;

  private final Provider<TokenStorage> tokenStorageProvider;

  public DatabaseCheckInRepository_Factory(Provider<DatabaseDataSource> dbProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    this.dbProvider = dbProvider;
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public DatabaseCheckInRepository get() {
    return newInstance(dbProvider.get(), tokenStorageProvider.get());
  }

  public static DatabaseCheckInRepository_Factory create(
      javax.inject.Provider<DatabaseDataSource> dbProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new DatabaseCheckInRepository_Factory(Providers.asDaggerProvider(dbProvider), Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static DatabaseCheckInRepository_Factory create(Provider<DatabaseDataSource> dbProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    return new DatabaseCheckInRepository_Factory(dbProvider, tokenStorageProvider);
  }

  public static DatabaseCheckInRepository newInstance(DatabaseDataSource db,
      TokenStorage tokenStorage) {
    return new DatabaseCheckInRepository(db, tokenStorage);
  }
}
