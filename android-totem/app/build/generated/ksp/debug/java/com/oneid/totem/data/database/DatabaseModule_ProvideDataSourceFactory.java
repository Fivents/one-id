package com.oneid.totem.data.database;

import com.zaxxer.hikari.HikariDataSource;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
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
public final class DatabaseModule_ProvideDataSourceFactory implements Factory<HikariDataSource> {
  @Override
  public HikariDataSource get() {
    return provideDataSource();
  }

  public static DatabaseModule_ProvideDataSourceFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static HikariDataSource provideDataSource() {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideDataSource());
  }

  private static final class InstanceHolder {
    static final DatabaseModule_ProvideDataSourceFactory INSTANCE = new DatabaseModule_ProvideDataSourceFactory();
  }
}
