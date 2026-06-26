package com.oneid.totem.data.database.repo;

import com.oneid.totem.data.database.ActiveContextRepository;
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
public final class DatabaseAuthRepository_Factory implements Factory<DatabaseAuthRepository> {
  private final Provider<DatabaseDataSource> dbProvider;

  private final Provider<ActiveContextRepository> activeContextRepositoryProvider;

  private final Provider<TokenStorage> tokenStorageProvider;

  public DatabaseAuthRepository_Factory(Provider<DatabaseDataSource> dbProvider,
      Provider<ActiveContextRepository> activeContextRepositoryProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    this.dbProvider = dbProvider;
    this.activeContextRepositoryProvider = activeContextRepositoryProvider;
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public DatabaseAuthRepository get() {
    return newInstance(dbProvider.get(), activeContextRepositoryProvider.get(), tokenStorageProvider.get());
  }

  public static DatabaseAuthRepository_Factory create(
      javax.inject.Provider<DatabaseDataSource> dbProvider,
      javax.inject.Provider<ActiveContextRepository> activeContextRepositoryProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new DatabaseAuthRepository_Factory(Providers.asDaggerProvider(dbProvider), Providers.asDaggerProvider(activeContextRepositoryProvider), Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static DatabaseAuthRepository_Factory create(Provider<DatabaseDataSource> dbProvider,
      Provider<ActiveContextRepository> activeContextRepositoryProvider,
      Provider<TokenStorage> tokenStorageProvider) {
    return new DatabaseAuthRepository_Factory(dbProvider, activeContextRepositoryProvider, tokenStorageProvider);
  }

  public static DatabaseAuthRepository newInstance(DatabaseDataSource db,
      ActiveContextRepository activeContextRepository, TokenStorage tokenStorage) {
    return new DatabaseAuthRepository(db, activeContextRepository, tokenStorage);
  }
}
