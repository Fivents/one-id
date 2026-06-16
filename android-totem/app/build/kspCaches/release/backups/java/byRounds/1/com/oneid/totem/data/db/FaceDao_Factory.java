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
public final class FaceDao_Factory implements Factory<FaceDao> {
  private final Provider<DatabaseManager> dbProvider;

  public FaceDao_Factory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public FaceDao get() {
    return newInstance(dbProvider.get());
  }

  public static FaceDao_Factory create(javax.inject.Provider<DatabaseManager> dbProvider) {
    return new FaceDao_Factory(Providers.asDaggerProvider(dbProvider));
  }

  public static FaceDao_Factory create(Provider<DatabaseManager> dbProvider) {
    return new FaceDao_Factory(dbProvider);
  }

  public static FaceDao newInstance(DatabaseManager db) {
    return new FaceDao(db);
  }
}
