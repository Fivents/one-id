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
public final class SelfRegisterDao_Factory implements Factory<SelfRegisterDao> {
  private final Provider<DatabaseManager> dbProvider;

  public SelfRegisterDao_Factory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public SelfRegisterDao get() {
    return newInstance(dbProvider.get());
  }

  public static SelfRegisterDao_Factory create(javax.inject.Provider<DatabaseManager> dbProvider) {
    return new SelfRegisterDao_Factory(Providers.asDaggerProvider(dbProvider));
  }

  public static SelfRegisterDao_Factory create(Provider<DatabaseManager> dbProvider) {
    return new SelfRegisterDao_Factory(dbProvider);
  }

  public static SelfRegisterDao newInstance(DatabaseManager db) {
    return new SelfRegisterDao(db);
  }
}
