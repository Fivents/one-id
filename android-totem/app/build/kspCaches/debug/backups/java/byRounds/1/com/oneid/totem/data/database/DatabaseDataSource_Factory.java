package com.oneid.totem.data.database;

import com.zaxxer.hikari.HikariDataSource;
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
public final class DatabaseDataSource_Factory implements Factory<DatabaseDataSource> {
  private final Provider<HikariDataSource> dataSourceProvider;

  public DatabaseDataSource_Factory(Provider<HikariDataSource> dataSourceProvider) {
    this.dataSourceProvider = dataSourceProvider;
  }

  @Override
  public DatabaseDataSource get() {
    return newInstance(dataSourceProvider.get());
  }

  public static DatabaseDataSource_Factory create(
      javax.inject.Provider<HikariDataSource> dataSourceProvider) {
    return new DatabaseDataSource_Factory(Providers.asDaggerProvider(dataSourceProvider));
  }

  public static DatabaseDataSource_Factory create(Provider<HikariDataSource> dataSourceProvider) {
    return new DatabaseDataSource_Factory(dataSourceProvider);
  }

  public static DatabaseDataSource newInstance(HikariDataSource dataSource) {
    return new DatabaseDataSource(dataSource);
  }
}
