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
public final class DatabaseModule_ProvideActiveEventResolverFactory implements Factory<ActiveEventResolver> {
  private final Provider<DatabaseManager> dbProvider;

  public DatabaseModule_ProvideActiveEventResolverFactory(Provider<DatabaseManager> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public ActiveEventResolver get() {
    return provideActiveEventResolver(dbProvider.get());
  }

  public static DatabaseModule_ProvideActiveEventResolverFactory create(
      javax.inject.Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvideActiveEventResolverFactory(Providers.asDaggerProvider(dbProvider));
  }

  public static DatabaseModule_ProvideActiveEventResolverFactory create(
      Provider<DatabaseManager> dbProvider) {
    return new DatabaseModule_ProvideActiveEventResolverFactory(dbProvider);
  }

  public static ActiveEventResolver provideActiveEventResolver(DatabaseManager db) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideActiveEventResolver(db));
  }
}
