package com.oneid.totem.data.local;

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
public final class TokenStorage_Factory implements Factory<TokenStorage> {
  private final Provider<TotemPreferences> prefsProvider;

  public TokenStorage_Factory(Provider<TotemPreferences> prefsProvider) {
    this.prefsProvider = prefsProvider;
  }

  @Override
  public TokenStorage get() {
    return newInstance(prefsProvider.get());
  }

  public static TokenStorage_Factory create(javax.inject.Provider<TotemPreferences> prefsProvider) {
    return new TokenStorage_Factory(Providers.asDaggerProvider(prefsProvider));
  }

  public static TokenStorage_Factory create(Provider<TotemPreferences> prefsProvider) {
    return new TokenStorage_Factory(prefsProvider);
  }

  public static TokenStorage newInstance(TotemPreferences prefs) {
    return new TokenStorage(prefs);
  }
}
