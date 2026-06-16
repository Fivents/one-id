package com.oneid.totem.data.repository.impl;

import com.oneid.totem.data.db.ActiveEventResolver;
import com.oneid.totem.data.local.TotemPreferences;
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
public final class AuthRepositoryImpl_Factory implements Factory<AuthRepositoryImpl> {
  private final Provider<ActiveEventResolver> eventResolverProvider;

  private final Provider<TotemPreferences> prefsProvider;

  public AuthRepositoryImpl_Factory(Provider<ActiveEventResolver> eventResolverProvider,
      Provider<TotemPreferences> prefsProvider) {
    this.eventResolverProvider = eventResolverProvider;
    this.prefsProvider = prefsProvider;
  }

  @Override
  public AuthRepositoryImpl get() {
    return newInstance(eventResolverProvider.get(), prefsProvider.get());
  }

  public static AuthRepositoryImpl_Factory create(
      javax.inject.Provider<ActiveEventResolver> eventResolverProvider,
      javax.inject.Provider<TotemPreferences> prefsProvider) {
    return new AuthRepositoryImpl_Factory(Providers.asDaggerProvider(eventResolverProvider), Providers.asDaggerProvider(prefsProvider));
  }

  public static AuthRepositoryImpl_Factory create(
      Provider<ActiveEventResolver> eventResolverProvider,
      Provider<TotemPreferences> prefsProvider) {
    return new AuthRepositoryImpl_Factory(eventResolverProvider, prefsProvider);
  }

  public static AuthRepositoryImpl newInstance(ActiveEventResolver eventResolver,
      TotemPreferences prefs) {
    return new AuthRepositoryImpl(eventResolver, prefs);
  }
}
