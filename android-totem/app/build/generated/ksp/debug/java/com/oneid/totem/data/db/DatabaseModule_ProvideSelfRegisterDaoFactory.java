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
public final class DatabaseModule_ProvideSelfRegisterDaoFactory implements Factory<SelfRegisterDao> {
  private final Provider<DatabaseManager> dbProvider;

  public DatabaseModule_ProvideSelfRegisterDaoFactory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public SelfRegisterDao get() {
    return provideSelfRegisterDao(dbProvider.get());
  }

  public static DatabaseModule_ProvideSelfRegisterDaoFactory create(
      javax.inject.Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvideSelfRegisterDaoFactory(Providers.asDaggerProvider(dbProvider));
  }

  public static DatabaseModule_ProvideSelfRegisterDaoFactory create(
      Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvideSelfRegisterDaoFactory(dbProvider);
  }

  public static SelfRegisterDao provideSelfRegisterDao(DatabaseManager db) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideSelfRegisterDao(db));
  }
}
