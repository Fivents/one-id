package com.oneid.totem.data.database;

import com.zaxxer.hikari.HikariDataSource;
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
public final class DatabaseModule_ProvideDatabaseDataSourceFactory implements Factory<DatabaseDataSource> {
  private final Provider<HikariDataSource> dataSourceProvider;

  public DatabaseModule_ProvideDatabaseDataSourceFactory(
      Provider<HikariDataSource> dataSourceProvider) {
    this.dataSourceProvider = dataSourceProvider;
  }

  @Override
  public DatabaseDataSource get() {
    return provideDatabaseDataSource(dataSourceProvider.get());
  }

  public static DatabaseModule_ProvideDatabaseDataSourceFactory create(
      javax.inject.Provider<HikariDataSource> dataSourceProvider) {
    return new DatabaseModule_ProvideDatabaseDataSourceFactory(Providers.asDaggerProvider(dataSourceProvider));
  }

  public static DatabaseModule_ProvideDatabaseDataSourceFactory create(
      Provider<HikariDataSource> dataSourceProvider) {
    return new DatabaseModule_ProvideDatabaseDataSourceFactory(dataSourceProvider);
  }

  public static DatabaseDataSource provideDatabaseDataSource(HikariDataSource dataSource) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideDatabaseDataSource(dataSource));
  }
}
