package com.oneid.totem.data.db;

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
public final class DatabaseModule_ProvideDatabaseManagerFactory implements Factory<DatabaseManager> {
  @Override
  public DatabaseManager get() {
    return provideDatabaseManager();
  }

  public static DatabaseModule_ProvideDatabaseManagerFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static DatabaseManager provideDatabaseManager() {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideDatabaseManager());
  }

  private static final class InstanceHolder {
    static final DatabaseModule_ProvideDatabaseManagerFactory INSTANCE = new DatabaseModule_ProvideDatabaseManagerFactory();
  }
}
